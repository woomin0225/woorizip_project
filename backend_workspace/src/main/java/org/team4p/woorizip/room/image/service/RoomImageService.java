package org.team4p.woorizip.room.image.service;

import java.util.List;

import org.team4p.woorizip.room.image.dto.RoomImageDto;

public interface RoomImageService {
	List<RoomImageDto> selectRoomImages(String roomNo);
	RoomImageDto insertRoomImage(RoomImageDto roomImageDto);
}
