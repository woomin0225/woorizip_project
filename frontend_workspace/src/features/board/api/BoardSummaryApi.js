import { apiJson } from '../../../app/http/request';

export function fetchBoardSummary(postNo) {
  return apiJson().get(`/api/boards/${postNo}/summary`);
}
