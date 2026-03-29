import { apiJson } from '../../../app/http/request';
import { getAiBaseUrl } from '../../../app/config/env';

function isMissingEndpointError(error) {
  const status = Number(error?.response?.status);
  return status === 404 || status === 405 || status === 501;
}

async function postWithPathFallback(payload, paths) {
  let lastError;

  for (let i = 0; i < paths.length; i += 1) {
    const path = paths[i];
    try {
      const response = await apiJson().post(path, payload, {
        baseURL: getAiBaseUrl(),
        responseType: 'arraybuffer',
      });
      return {
        audioBytes: response.data,
        mimeType: response.headers?.['content-type'] || 'audio/wav',
      };
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
 * Azure TTS 호출
 * @param {{ text: string, voiceName?: string }} payload
 */
export async function synthesizeTts(payload) {
  return postWithPathFallback(payload, ['/api/voice/tts']);
}
