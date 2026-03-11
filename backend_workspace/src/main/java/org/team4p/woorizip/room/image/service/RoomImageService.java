package org.team4p.woorizip.room.image.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.room.image.dto.RoomImageDto;

public interface RoomImageService {
	List<RoomImageDto> selectRoomImages(String roomNo);
	int insertRoomImage(List<MultipartFile> newImages, String roomNo);
	int deleteRoomImageByRoomImageNo(List<Integer> deleteImageNos, String roomNo);
	void deleteRoomImagesAll(String roomNo);
	int countRoomImageNumber(String roomNo);
}
