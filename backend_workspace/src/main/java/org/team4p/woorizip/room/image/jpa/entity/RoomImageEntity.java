package org.team4p.woorizip.room.image.jpa.entity;

import org.team4p.woorizip.room.image.dto.RoomImageDto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@Table(name="tb_rooms_images")
@Entity
public class RoomImageEntity {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	@Column(name="room_image_no")
	private Integer roomImageNo;
	
	@Column(name="room_no")
	private String roomNo;
	
	@Column(name="room_original_image_name")
	private String roomOriginalImageName;
	
	@Column(name="room_stored_image_name")
	private String roomStoredImageName;
	
	public RoomImageDto toDto() {
		return RoomImageDto.builder()
				.roomImageNo(roomImageNo)
				.roomNo(roomNo)
				.roomOriginalImageName(roomOriginalImageName)
				.roomStoredImageName(roomStoredImageName)
				.build();
	}
}
