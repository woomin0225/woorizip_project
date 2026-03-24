// src/features/houseAndRoom/api/houseApi.js
import { apiJson, apiForm } from '../../../app/http/request';

function unwrap(res) {
  return (res && typeof res === "object" && "data" in res) ? res.data : res;
}

// 검색-건물마커조회 GET
export async function getHouseMarkers(cond) {
  const { data } = await apiJson().get('/api/houses/marker', {params: {...cond}});   //  @ModelAttribute: params로 보냄
  return unwrap(data); // ApiResponse<List<HouseMarkerResponse>>
}

// 임대인용 건물 목록 조회 GET
export async function getMyHouses(targetUserNo = '') {
  const { data } = await apiJson().get('/api/houses/owner', {
    params: { targetUserNo },
  });
  return unwrap(data); // ApiResponse<List<HouseDto>>
}

// 건물의 방 조회 GET
export async function getRoomByHouseNo(houseNo) {
  const { data } = await apiJson().get(`/api/houses/${houseNo}/rooms`);
  return unwrap(data); // ApiResponse<List<RoomDto>>
}

// 건물 상세 조회 GET
export async function getHouse(houseNo) {
  const { data } = await apiJson().get(`/api/houses/${houseNo}`);
  return unwrap(data); // ApiResponse<HouseDto>
}

// 건물 등록 POST
export async function createHouse(houseDto, newImages = []){
    const fd = new FormData();

    houseDto.forEach(([key, value])=>{
        fd.append(key, value);
    });

    (newImages ?? []).forEach((file)=>{
        if(file) fd.append('newImages', file);
    });
    
    const {data} = await apiForm().post('/api/houses', fd);
    return unwrap(data);    // Void
}

// 건물 정보 수정 PUT
export async function modifyHouse(houseNo, houseDto, deleteImageNos = [], newImages = []){
    const fd = new FormData();

    houseDto.forEach(([key, value])=>{
        if(value === null || value === undefined) return;   //forEach에서 return은 continue역할
        if(value === "null") return;
        fd.append(key, value);
    });

    (deleteImageNos ?? []).forEach((imageNo)=>{
        if(imageNo !== null && imageNo !== undefined) fd.append('deleteImageNos', imageNo);
    });

    (newImages ?? []).forEach((file)=>{
        if(file) fd.append('newImages', file);
    });
    
    const {data} = await apiForm().put(`/api/houses/${houseNo}`, fd);
    return unwrap(data);    // Void
}

// 건물 소프트 삭제 DELETE
export async function deleteHouse(houseNo){
    const {data} = await apiJson().delete(`/api/houses/${houseNo}`);
    return unwrap(data);    // Void
}

// 건물 이미지 목록 조회 GET
export async function getHouseImages(houseNo){
    const {data} = await apiJson().get(`/api/houses/${houseNo}/images`);
    return unwrap(data);
}

// 검색-건물마커 클릭시 방 목록 조회 GET 
export async function getRoomsInHouseMarker(houseNo, cond={}, page=0, size=10){
    const {data} = await apiJson().get(`/api/houses/${houseNo}/search`, {params: {...cond, page, size},});
    return unwrap(data);    // Slice<RoomSearchResponse>
}

// 조회수 높은 순 houseNo 조회
export async function getViewsRankingOfHouses(period, limit) {
    // period: {DAY1: 최근1일, DAY7: 최근7일, DAY: 30: 최근30일}
    // limit: 조회할 갯수
  const { data } = await apiJson().get('/api/houses/view/popular', {params: {period, limit}});   //  @ModelAttribute: params로 보냄
  return unwrap(data); // ApiResponse<List<HouseMarkerResponse>>
}
