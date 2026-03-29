// src/features/houseAndRoom/api/roomApi.js
import { apiJson, apiForm } from '../../../app/http/request';

function unwrap(res) {
  // 백엔드 응답이 보통 { data: 실제값 } 형태라서
  // 화면에서는 매번 res.data.data처럼 접근하지 않도록 여기서 한 번 풀어 줍니다.
  return res && typeof res === 'object' && 'data' in res ? res.data : res;
}

// 기존 필터 검색 API입니다.
// cond: 검색 조건 객체
// page, size: 몇 번째 페이지를 몇 개씩 가져올지 정하는 값
export async function searchRooms(cond, page = 0, size = 10) {
  const { data } = await apiJson().get('/api/rooms/search', {
    params: { ...cond, page, size },
  });
  return unwrap(data); // RoomSearchSliceResponse
}

// 자연어 검색 API입니다.
// 일반 검색과 달리 "문장 전체"를 그대로 보내야 해서 plain text body를 사용합니다.
export async function searchRoomsByNaturalText(text) {
  const { data } = await apiJson().post('/api/rooms/rag/room', text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
  return unwrap(data); // { rooms: List<RoomDto>, explanation: string }
}

export async function searchRoomsByNaturalTextExplanation(text) {
  const { data } = await apiJson().post('/api/rooms/rag/room/explanation', text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
  return unwrap(data); // string
}

// 방 등록 POST
export async function createRoom(houseNo, roomDto, newImages = []) {
  const fd = new FormData();

  roomDto.forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (value === 'null' || value === 'undefined') return;
    fd.append(key, value);
  });

  fd.set('houseNo', houseNo);

  (newImages ?? []).forEach((file) => {
    if (file) fd.append('newImages', file);
  });

  const { data } = await apiForm().post('/api/rooms', fd);
  return unwrap(data); // Void
}

// 방 소프트 삭제 DELETE
export async function deleteRoom(roomNo) {
  const { data } = await apiJson().delete(`/api/rooms/${roomNo}`);
  return unwrap(data); // Void
}

// 방 상세 조회 GET
export async function getRoom(roomNo) {
  const { data } = await apiJson().get(`/api/rooms/${roomNo}`);
  return unwrap(data); // RoomDto
}

// 방 상세: 이미지 조회 GET
export async function getRoomImages(roomNo) {
  const { data } = await apiJson().get(`/api/rooms/${roomNo}/images`);
  return unwrap(data); // List<RoomImageDto>
}

// 방 상세: AI 종합 요약 조회 GET
export async function getSummarizedRoom(roomNo) {
  const { data } = await apiJson().get(`/api/rooms/${roomNo}/summarized_room`);
  return unwrap(data); // RoomFinalSummaryEntity
}

// 방 상세: AI 종합 요약 생성 요청 POST
export async function requestSummarizedRoom(roomNo) {
  const { data } = await apiJson().post(`/api/rooms/${roomNo}/summarized_room/request`);
  return unwrap(data); // RoomFinalSummaryEntity
}

// 방 상세: 리뷰 목록 조회 GET
export async function getRoomReviews(
  roomNo,
  page = 0,
  size = 10,
  options = {}
) {
  const params = { page, size };
  if (options?.sort) params.sort = options.sort;
  const { data } = await apiJson().get(`/api/rooms/${roomNo}/reviews`, {
    params,
  });
  return unwrap(data); // Page<ReviewDto>
}

// 방 수정 PUT
export async function modifyRoom(
  roomNo,
  roomDto,
  deleteImageNos = [],
  newImages = []
) {
  const fd = new FormData();

  roomDto.forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (value === 'null') return;
    fd.append(key, value);
  });

  (deleteImageNos ?? []).forEach((imageNo) => {
    if (imageNo !== null && imageNo !== undefined) {
      fd.append('deleteImageNos', imageNo);
    }
  });

  (newImages ?? []).forEach((file) => {
    if (file) fd.append('newImages', file);
  });

  const { data } = await apiForm().put(`/api/rooms/${roomNo}`, fd);
  return unwrap(data); // Void
}

// 방 리뷰 등록 POST
export async function createRoomReview(roomNo, reviewDto) {
  const { data } = await apiJson().post(
    `/api/rooms/${roomNo}/reviews`,
    reviewDto
  );
  return unwrap(data); // Void
}

// 방 리뷰 삭제 DELETE
export async function deleteRoomReview(roomNo, reviewNo) {
  const { data } = await apiJson().delete(
    `/api/rooms/${roomNo}/reviews/${reviewNo}`
  );
  return unwrap(data); // Void
}

// 방 리뷰 수정 PUT
export async function modifyRoomReview(roomNo, reviewNo, reviewDto) {
  const { data } = await apiJson().put(
    `/api/rooms/${roomNo}/reviews/${reviewNo}`,
    reviewDto
  );
  return unwrap(data); // Void
}

// 방 입주 가능일 변경 PATCH
export async function modifyRoomAvailability(roomNo, date) {
  const { data } = await apiJson().patch(
    `/api/rooms/${roomNo}/availability`,
    date
  );
  return unwrap(data); // Void
}

// 방 공실 여부 변경 PATCH
export async function modifyRoomEmptyYn(roomNo) {
  const { data } = await apiJson().patch(`/api/rooms/${roomNo}/emptyyn`);
  return unwrap(data);
}

// 조회 수 기준 방 랭킹 조회
export async function getViewsRankingOfRooms(period, limit) {
  const { data } = await apiJson().get('/api/rooms/view/popular', {
    params: { period, limit },
  });
  return unwrap(data); // List<ViewsRankingResponse>
}

// 리뷰 평점 기준 방 랭킹 조회
export async function getReviewRanking(period, limit) {
  const { data } = await apiJson().get(`/api/rooms/review/popular`, {
    params: { period, limit },
  });
  return unwrap(data); // List<ReviewRankingResponse>
}

// 찜 수 기준 방 랭킹 조회
export async function getWishRanking(limit) {
  const { data } = await apiJson().get(`/api/rooms/wish/popular`, {
    params: { limit },
  });
  return unwrap(data);
}

// 방 이미지 AI 분석
export async function analyzeRoomImages(images = []) {
  const fd = new FormData();

  (images ?? []).forEach((file) => {
    if (file) fd.append('images', file);
  });

  const { data } = await apiForm().post('/api/rooms/ai/analyze/image', fd);
  return unwrap(data);
}
