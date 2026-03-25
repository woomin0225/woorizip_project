// src/features/aiAssistant/api/orchestrateApi.js
import { apiJson } from '../../../app/http/request';
import { getAiBaseUrl } from '../../../app/config/env';

const ORCHESTRATE_TIMEOUT_MS = 60000;

function isMissingEndpointError(error) {
  const status = Number(error?.response?.status);
  return status === 404 || status === 405 || status === 501;
}

async function postWithPathFallback(payload, paths) {
  let lastError;
  const userProfile = payload?.context?.userProfile || {};
  const extraHeaders = {
    ...(userProfile?.userName
      ? { 'X-User-Name': String(userProfile.userName).trim() }
      : {}),
    ...(userProfile?.userPhone
      ? { 'X-User-Phone': String(userProfile.userPhone).trim() }
      : {}),
  };

  for (let i = 0; i < paths.length; i += 1) {
    const path = paths[i];
    try {
      const { data } = await apiJson().post(path, payload, {
        baseURL: getAiBaseUrl(),
        timeout: ORCHESTRATE_TIMEOUT_MS,
        headers: extraHeaders,
      });
      return data;
    } catch (error) {
      lastError = error;
      if (!isMissingEndpointError(error) || i === paths.length - 1) {
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * AI Agent command
 * @param {{ schemaVersion?: string, text: string, sessionId?: string, clientRequestId?: string, systemPrompt?: string, context?: Record<string, unknown> }} payload
 */
export async function runOrchestrateCommand(payload) {
  const data = await postWithPathFallback(payload, ['/api/agent/command']);

  if (data && typeof data.success === 'boolean') {
    if (!data.success) {
      throw new Error(data.message || 'Agent 요청 실패');
    }
    return data.data;
  }

  return data;
}
