package org.team4p.woorizip.room.view.dto;

import java.time.LocalDateTime;

import org.team4p.woorizip.room.view.jpa.entity.RoomViewEntity;
import org.team4p.woorizip.room.view.jpa.entity.RoomViewId;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomViewDto {
	private RoomViewId id;
	private Integer viewCount;
	private LocalDateTime updatedAt;
	
	public RoomViewEntity toEntity() {
		return RoomViewEntity.builder()
							.id(id)
							.viewCount(viewCount)
							.updatedAt(updatedAt)
							.build();
	}
}
