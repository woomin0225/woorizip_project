package org.team4p.woorizip.room.image.jpa.entity;

import java.time.LocalDateTime;

import org.team4p.woorizip.room.review.jpa.entity.ReviewSummaryEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="tb_room_image_summary")
public class RoomImageSummaryEntity {
	
	@Id
	@Column(name="room_no")
	private String roomNo;
	
	@Column(name="summary_status")
	private String summaryStatus;
	
	@Column(name="image_count")
	private Integer imageCount;
	
	@Column(name="updated_at")
	private LocalDateTime updatedAt;
	
	@Column(name="image_summary")
	private String reviewSummary;
	
	@Column(name="last_error_message")
	private String lastErrorMessage;
	
	@Column(name="retry_count")
	private Integer retryCount;
	
}