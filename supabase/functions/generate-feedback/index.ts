import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_MODEL_ID = 'gemini-3.1-flash-lite';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_RETRIES = 2;

function getApiKeys() {
  const raw = Deno.env.get('GEMINI_API_KEY') || '';
  return raw
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);
}

async function callGeminiApi(apiKey: string, prompt: string) {
  const url = `${API_BASE}/${GEMINI_MODEL_ID}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const status = response.status;
    if (status === 429 || status === 403) {
      const err = new Error(`API key exhausted (${status})`);
      (err as any).isQuotaError = true;
      throw err;
    }
    throw new Error(`Gemini API error ${status}: ${errorBody?.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API returned empty response');
  }

  return text;
}

async function callWithRotation(prompt: string) {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const apiKey = keys[keyIndex];

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await callGeminiApi(apiKey, prompt);
      } catch (err: any) {
        console.warn(`[Gemini] Key ${keyIndex + 1}/${keys.length}, attempt ${attempt + 1}: ${err.message}`);
        
        if (err.isQuotaError) break; // Next key

        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
  }

  throw new Error('모든 API 키의 할당량이 소진되었거나, 반복된 오류로 응답을 받지 못했습니다.');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    // 1. Edge Function 내부에서 Supabase 클라이언트 초기화 (요청한 유저의 권한으로)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // 2. 서버 측 검증: 이미 오늘 피드백이 생성되었는지 확인
    // 한국 시간(KST) 기준으로 오늘 날짜(YYYY-MM-DD) 추출
    const todayStr = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })).toLocaleDateString('en-CA');
    
    const { data: summary } = await supabaseClient
      .from('daily_summaries')
      .select('ai_feedback')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle();

    if (summary && summary.ai_feedback) {
      throw new Error("오늘의 피드백이 이미 생성되었습니다. (중복 요청 차단)");
    }

    // 3. 클라이언트가 보내는 데이터를 믿지 않고 DB에서 직접 식단 정보 조회
    const { data: profile } = await supabaseClient
      .from('users_profile')
      .select('eating_window')
      .eq('id', user.id)
      .single();

    const eatingWindow = profile?.eating_window || 8;

    const { data: mealLogs } = await supabaseClient
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', `${todayStr}T00:00:00+09:00`)
      .order('logged_at', { ascending: true });

    if (!mealLogs || mealLogs.length === 0) {
      throw new Error("오늘 기록된 식단이 없어 피드백을 생성할 수 없습니다.");
    }

    // 4. 프롬프트 생성
    const mealSummary = mealLogs
      .map((log: any) => {
        const date = new Date(log.logged_at);
        const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        return `- ${time} ${log.food_name} (비고: ${log.amount})`;
      })
      .join('\n');

    const prompt = `당신은 간헐적 단식 전문 대사 건강 코치입니다. 아래 사용자의 오늘 식단 데이터를 분석하여 한국어로 간결한 피드백(3~5문장)을 제공하세요.

[사용자 설정]
- 식사 가능 시간: ${eatingWindow}시간
- 목표 공복 시간: ${24 - eatingWindow}시간

[오늘의 식단 기록]
${mealSummary}

[지침]
1. 공복 시간 달성 여부를 먼저 언급하세요.
2. 음식 선택에 대한 구체적인 코멘트를 해주세요.
3. 내일을 위한 실천 가능한 개선점 1가지를 제안하세요.
4. 격려하는 톤으로 작성하세요.
5. 답변은 순수 텍스트로만, 마크다운 없이 작성하세요.`;

    // 5. Gemini API 호출
    const feedback = await callWithRotation(prompt);

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
