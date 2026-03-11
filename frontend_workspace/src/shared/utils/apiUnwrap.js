// src/shared/utils/apiUnwrap.js

/**
 * 공통 API 응답 언랩 함수
 * 백엔드 응답 구조:
 * {
 *   success: boolean,
 *   message: string,
 *   data: any
 * }
 */
export function unwrapApi(response) {
  if (!response) return null;

  const body = response.data;

  if (!body) return null;

  if (body.success === false) {
    throw new Error(body.message || 'API 요청 실패');
  }

  return body.data;
}
