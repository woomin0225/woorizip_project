import { apiJson } from '../../../app/http/request';

export async function summarizePageForVoice(payload) {
  const response = await apiJson().post('/api/voice/page-summary', {
    title: payload?.title || '',
    text: payload?.text || '',
    bullets: payload?.bullets || 3,
  });

  return response?.data?.data || response?.data;
}
