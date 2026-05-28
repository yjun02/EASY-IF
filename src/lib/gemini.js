import { supabase } from './supabase';

/**
 * 일일 AI 피드백을 생성합니다. (Supabase Edge Function 호출)
 * @returns {Promise<string>} AI 코칭 텍스트
 */
export const generateDailyFeedback = async (token) => {
  const options = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const { data, error } = await supabase.functions.invoke('generate-feedback', options);

  if (error) {
    let detail = '';
    if (error.context && typeof error.context.json === 'function') {
      try {
        const errBody = await error.context.json();
        detail = errBody.error || JSON.stringify(errBody);
      } catch (e) {
        detail = 'Could not parse error body';
      }
    }
    throw new Error(detail ? `[Edge Function Error] ${detail}` : error.message || 'Edge Function invocation failed');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.feedback;
};
