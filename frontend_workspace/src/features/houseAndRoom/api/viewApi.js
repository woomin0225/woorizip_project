// src/features/houseAndRoom/api/viewApi.js
import { apiJson } from '../../../app/http/request';

function unwrap(res) {
  return (res && typeof res === "object" && "data" in res) ? res.data : res;
}

// 조회수 높은 순 roomNo 조회
export async function getPopularRooms(period, limit) {
    // period: {DAY1: 최근1일, DAY7: 최근7일, DAY: 30: 최근30일}
    // limit: 조회할 갯수
  const { data } = await apiJson().get('/api/room_view/popular', {params: {period, limit}});   //  @ModelAttribute: params로 보냄
  return unwrap(data); // ApiResponse<List<HouseMarkerResponse>>
}

// 조회수 높은 순 houseNo 조회
export async function getPopularHouses(period, limit) {
    // period: {DAY1: 최근1일, DAY7: 최근7일, DAY: 30: 최근30일}
    // limit: 조회할 갯수
  const { data } = await apiJson().get('/api/house_view/popular', {params: {period, limit}});   //  @ModelAttribute: params로 보냄
  return unwrap(data); // ApiResponse<List<HouseMarkerResponse>>
}
