// src/features/aiAssistant/api/orchestrateApi.js
import { apiJson } from '../../../app/http/request';
import { getAiBaseUrl } from '../../../app/config/env';

/**
 * watsonx Orchestrate 명령 실행
 * @param {{ schemaVersion?: string, text: string, sessionId?: string, clientRequestId?: string, context?: Record<string, unknown> }} payload
 */
export async function runOrchestrateCommand(payload) {
  const { data } = await apiJson().post('/api/orchestrate/command', payload, {
    baseURL: getAiBaseUrl(),
  });

  if (data && typeof data.success === 'boolean') {
    if (!data.success) {
      throw new Error(data.message || 'Orchestrate 요청 실패');
    }
    return data.data;
  }

  return data;
}
