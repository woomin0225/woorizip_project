// src/features/facility/api/reservation.js
import { apiJson } from '../../../app/http/request';

// 예약 목록 조회
export async function fetchReservationList(houseNo = "") {
  const url = houseNo ? `/api/reservations/${houseNo}` : '/api/reservations';
  const { data } = await apiJson().get(url);
  return data;
}

// 예약 상세 조회
export async function fetchReservationDetail(reservationNo) {
  const { data } = await apiJson().get(`/api/reservations/${reservationNo}`);
  return data;
}

// 예약 신규 등록
export async function createReservation(facilityNo, dto) {
  const { data } = await apiJson().post(`/api/facilities/${facilityNo}/reservations`, dto);
  return data;
}

// 예약 내용 수정
export async function modifyReservation(reservationNo, dto) {
  const { data } = await apiJson().patch(`/api/reservations/${reservationNo}`, dto);
  return data;
}