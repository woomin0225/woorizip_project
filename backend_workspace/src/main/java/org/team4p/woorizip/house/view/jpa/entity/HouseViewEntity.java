package org.team4p.woorizip.house.view.jpa.entity;

import java.time.LocalDateTime;

import org.team4p.woorizip.house.view.dto.HouseViewDto;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="tb_house_view_hourly")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseViewEntity {
	
	@EmbeddedId
	private HouseViewId id;
	@Column(name="view_count", nullable=false)
	private Integer viewCount;
	@Column(name="updated_at")
	private LocalDateTime updatedAt;
	
	public HouseViewDto toDto() {
		return HouseViewDto.builder()
							.id(id)
							.viewCount(viewCount)
							.updatedAt(updatedAt)
							.build();
	}
}
