// src/features/facility/api/reservation.js
import { apiJson } from '../../../app/http/request';

// 예약 목록 조회
export async function getReservationList({
  page = 1,
  size = 10,
  sort = 'reservationDate,reservationStartTime',
  direct = 'DESC',
  facilityNo = ""
}) {
  const url = facilityNo ? `/api/facilities/${facilityNo}/reservations` : '/api/reservations';
  const { data } = await apiJson().get(
    url,
    {params: { page, size, sort, direct }}
  );
  return data;
}

// 예약 상세 조회
export async function getReservationDetail(reservationNo) {
  const { data } = await apiJson().get(`/api/reservations/${reservationNo}`);
  return data;
}

// 예약 신규 등록
export async function createReservation(facilityNo, dto) {
  const { data } = await apiJson().post(`/api/facilities/${facilityNo}/reservations`, dto);
  return data;
}

// 예약 등록 시 기존 예약 시간 조회
export async function getReservationTime(facilityNo, date) {
  const { data } = await apiJson.get(`/api/facilities/${facilityNo}/reservations/check`,
    { params: { date } }
  );
  return data;
}

// 예약 내용 수정
export async function modifyReservation(reservationNo, dto) {
  const { data } = await apiJson().patch(`/api/reservations/${reservationNo}`, dto);
  return data;
}