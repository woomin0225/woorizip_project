// src/features/houseAndRoom/api/roomApi.js
import { apiJson, apiForm } from '../../../app/http/request';

function unwrap(res) {
  return (res && typeof res === "object" && "data" in res) ? res.data : res;
}

// 검색-방 목록 조회 GET
export async function searchRooms(cond, page=0, size=10){
    const {data} = await apiJson().get('/api/rooms/search', {params: {...cond, page, size}});
    return unwrap(data);    // Slice<RoomSearchResponse>
}

// 방 등록 POST
export async function createRoom(houseNo, roomDto, newImages = []){
    const fd = new FormData();

    roomDto.forEach(([key, value])=>{
        fd.append(key, value);
    });
    
    fd.set('houseNo', houseNo);

    (newImages ?? []).forEach((file)=>{
        if(file) fd.append('newImages', file);
    });
    
    const {data} = await apiForm().post('/api/rooms', fd);
    return unwrap(data);    // Void
}

// 방 소프트 삭제 DELETE
export async function deleteRoom(roomNo){
    const {data} = await apiJson().delete(`/api/rooms/${roomNo}`);
    return unwrap(data);    // Void
}

// 방 상세 조회 GET
export async function getRoom(roomNo){
    const {data} = await apiJson().get(`/api/rooms/${roomNo}`);
    return unwrap(data);    // RoomDto
}

// 방 상세 이미지 조회 GET
export async function getRoomImages(roomNo){
    const {data} = await apiJson().get(`/api/rooms/${roomNo}/images`);
    return unwrap(data);    // List<RoomImageDto>
}

// 방 상세 리뷰 조회 GET
export async function getRoomReviews(roomNo, page, size){
    const {data} = await apiJson().get(`/api/rooms/${roomNo}/reviews`, {params: {page, size}});
    return unwrap(data);    // Page<ReviewDto>
}

// 방 수정 PUT
export async function modifyRoom(roomNo, roomDto, deleteImageNos=[], newImages=[]){
    const fd = new FormData();

    roomDto.forEach(([key, value])=>{
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

    const {data} = await apiForm().put(`/api/rooms/${roomNo}`, fd);
    return unwrap(data);    // Void
}

// 방 리뷰 등록 POST
export async function createRoomReview(roomNo, reviewDto){
    const {data} = await apiJson().post(`/api/rooms/${roomNo}/reviews`, reviewDto);
    return unwrap(data);    // Void
}

// 방 리뷰 삭제 DELETE
export async function deleteRoomReview(roomNo, reviewNo){
    const {data} = await apiJson().delete(`/api/rooms/${roomNo}/reviews/${reviewNo}`);
    return unwrap(data);    // Void
}

// 방 리뷰 수정 PUT
export async function modifyRoomReview(roomNo, reviewNo, reviewDto){
    const {data} = await apiJson().put(`/api/rooms/${roomNo}/reviews/${reviewNo}`, reviewDto);
    return unwrap(data);    // Void
}

// 방 입주 가능 일자 변경 PATCH
export async function modifyRoomAvailability(roomNo, date){
    const {data} = await apiJson().patch(`/api/rooms/${roomNo}/availability`, date);  // date: LocalDate
    return unwrap(data);    // Void
}

// 방 공실여부 변경 PATCH
export async function modifyRoomEmptyYn(roomNo){
    const {data} = await apiJson().patch(`/api/rooms/${roomNo}/emptyyn`);
    return unwrap(data);
}