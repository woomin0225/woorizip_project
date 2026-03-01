package org.team4p.woorizip.house.view.dto;

import java.time.LocalDateTime;

import org.team4p.woorizip.house.view.jpa.entity.HouseViewEntity;
import org.team4p.woorizip.house.view.jpa.entity.HouseViewId;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseViewDto {
	private HouseViewId id;
	private Integer viewCount;
	private LocalDateTime updatedAt;
	
	public HouseViewEntity toEntity() {
		return HouseViewEntity.builder()
							.id(id)
							.viewCount(viewCount)
							.updatedAt(updatedAt)
							.build();
	}
}