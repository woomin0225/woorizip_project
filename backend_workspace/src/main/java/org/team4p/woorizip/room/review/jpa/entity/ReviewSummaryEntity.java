package org.team4p.woorizip.room.review.jpa.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
@Table(name="tb_room_review_summary")
public class ReviewSummaryEntity {
	
	@Id
	@Column(name="room_no")
	private String roomNo;
	
	@Column(name="summary_status")
	private String summaryStatus;
	
	@Column(name="review_count")
	private Integer reviewCount;
	
	@Column(name="updated_at")
	private LocalDateTime updatedAt;
	
	@Column(name="review_summary")
	private String reviewSummary;
	
	@Column(name="last_error_message")
	private String lastErrorMessage;
	
	@Column(name="retry_count")
	private Integer retryCount;
	
}