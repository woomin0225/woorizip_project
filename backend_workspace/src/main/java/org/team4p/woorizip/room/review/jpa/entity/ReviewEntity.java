package org.team4p.woorizip.room.review.jpa.entity;

import java.time.LocalDateTime;

import org.team4p.woorizip.room.review.dto.ReviewDto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@Table(name="tb_reviews")
@Entity
public class ReviewEntity {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	@Column(name="review_no")
	private Integer reviewNo;
	
	@Column(name="room_no")
	private String roomNo;
	
	@Column(name="user_no")
	private String userNo;
	
	@Column(name="rating")
	private Integer rating;
	
	@Column(name="review_content")
	private String reviewContent;
	
	@Column(name="review_created_at")
	private LocalDateTime reviewCreatedAt;
	
	@PrePersist
	public void prePersist() {
		
		if (reviewCreatedAt == null)
			reviewCreatedAt = LocalDateTime.now();
	}
	
	public ReviewDto toDto() {
		return ReviewDto.builder()
							.reviewNo(reviewNo)
							.roomNo(roomNo)
							.userNo(userNo)
							.rating(rating)
							.reviewContent(reviewContent)
							.reviewCreatedAt(reviewCreatedAt)
							.build();
	}
}
