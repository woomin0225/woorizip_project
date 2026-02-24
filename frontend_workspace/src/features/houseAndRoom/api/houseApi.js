// src/features/houseAndRoom/api/houseApi.js
import { apiJson, apiForm } from '../../../app/http/request';

// 검색-건물마커조회 GET
export async function getHouseMarkers(cond) {
  const { data } = await apiJson().get('/api/houses/marker', {params: cond});   //  @ModelAttribute: params로 보냄
  return data.data; // ApiResponse<List<HouseMarkerResponse>>
}

// 임대인용 건물 목록 조회 GET
export async function getMyHouses() {
  const { data } = await apiJson().get('/api/houses/owner');
  return data.data; // ApiResponse<List<HouseDto>>
}

// 건물의 방 조회 GET
export async function getRoomByHouseNo(houseNo) {
  const { data } = await apiJson().get(`/api/houses/${houseNo}/rooms`);
  return data.data; // ApiResponse<List<RoomDto>>
}

// 건물 상세 조회 GET
export async function getHouse(houseNo) {
  const { data } = await apiJson().get(`api/houses/${houseNo}`);
  return data.data; // ApiResponse<HouseDto>
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
    return data.data;    // Void
}

// 건물 정보 수정 PUT
export async function modifyHouse(houseNo, houseDto, deleteImageNos = [], newImages = []){
    const fd = new FormData();

    houseDto.forEach(([key, value])=>{
        fd.append(key, value);
    });

    (deleteImageNos ?? []).forEach((imageNo)=>{
        if(imageNo) fd.append('deleteImageNos', imageNo);
    });

    (newImages).forEach((file)=>{
        if(file) fd.append('newImages', file);
    });
    
    const {data} = await apiForm().put(`/api/houses/${houseNo}`, fd);
    return data.data;    // Void
}

// 건물 소프트 삭제 DELETE
export async function deleteHouse(houseNo){
    const {data} = await apiJson().delete(`/api/houses/${houseNo}`);
    return data.data;    // Void
}

// 건물 이미지 목록 조회 GET
export async function getHouseImages(houseNo){
    const {data} = await apiJson().get(`/api/houses/${houseNo}/images`);
    return data.data;
}

// 검색-건물마커 클릭시 방 목록 조회 GET 
export async function getRoomsInHouseMarker(houseNo, cond, page, size){
    const {data} = await apiJson().get(`/api/houses/${houseNo}/search`, {params: {cond, page, size}});
    return data.data;    // Slice<RoomSearchResponse>
}