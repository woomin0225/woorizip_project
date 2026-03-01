package org.team4p.woorizip.room.view.jpa.entity;

import java.time.LocalDateTime;

import org.team4p.woorizip.room.view.dto.RoomViewResponse;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="tb_room_view_hourly")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomViewEntity {
	@EmbeddedId
	private RoomViewId id;
	@Column(name="view_count", nullable=false)
	private Integer viewCount;
	@Column(name="updated_at")
	private LocalDateTime updatedAt;
}
