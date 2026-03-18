package org.team4p.woorizip.room.jpa.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="tb_room_embedding_status")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomEmbeddingEntity {
	@Id
	@Column(name="room_no")
	private String roomNo;
	
	@Column(name="embedding_status")
	private String embeddingStatus;
	
	@Column(name="updated_at")
	private LocalDateTime updatedAt;
	
	@Column(name="last_error_message")
	private String lastErrorMessage;
	
	@Column(name="retry_count")
	private Integer retryCount;
}
