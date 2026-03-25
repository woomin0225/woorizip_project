import { apiJson } from '../../../app/http/request';

const BOARD_SUMMARY_TIMEOUT_MS = 130000;

export function fetchBoardSummary(postNo) {
  return apiJson().get(`/api/boards/${postNo}/summary`, {
    timeout: BOARD_SUMMARY_TIMEOUT_MS,
  });
}
