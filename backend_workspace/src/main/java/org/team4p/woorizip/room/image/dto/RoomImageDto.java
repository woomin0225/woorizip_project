package org.team4p.woorizip.room.image.dto;

import org.team4p.woorizip.room.image.jpa.entity.RoomImageEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomImageDto {
	
	private int roomImageNo;
	
	private String roomNo;
	
	private String roomOriginalImageName;
	
	private String roomStoredImageName;
	
	public RoomImageEntity toEntity() {
		return RoomImageEntity.builder()
				.roomImageNo(roomImageNo)
				.roomNo(roomNo)
				.roomOriginalImageName(roomOriginalImageName)
				.roomStoredImageName(roomStoredImageName)
				.build();
	}
}
