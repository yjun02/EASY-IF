import { supabase } from './supabase';

/**
 * 일일 AI 피드백을 생성합니다. (Supabase Edge Function 호출)
 * @returns {Promise<string>} AI 코칭 텍스트
 */
export const generateDailyFeedback = async () => {
  const { data, error } = await supabase.functions.invoke('generate-feedback');

  if (error) {
    throw new Error(error.message || 'Edge Function invocation failed');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.feedback;
};
