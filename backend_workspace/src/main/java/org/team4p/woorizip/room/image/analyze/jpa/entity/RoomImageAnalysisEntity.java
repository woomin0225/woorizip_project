package org.team4p.woorizip.room.image.analyze.jpa.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@Table(name = "tb_rooms_image_analysis")
@Entity
@NoArgsConstructor
@AllArgsConstructor
public class RoomImageAnalysisEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "ANALYSIS_NO")
	private Long analysisNo;
	
	@Column(name = "ROOM_NO")
	private String roomNo;

	@Column(name = "ROOM_IMAGE_NO")
	private Integer roomImageNo;
	
	@Column(name = "SUMMARY")
	private String summary;
	
	@Column(name = "CAPTION")
	private String caption;
	
	@Column(name = "OCR_TEXT")
	private String ocrText;
	
	@Column(name = "NORMALIZED_OPTIONS")
	private String normalizedOptions;
	
	@Column(name = "RAW_JSON")
	private String rawJson;
	
	@Column(name = "ANALYSIS_CREATED_AT")
	private LocalDateTime analysisCreatedAt;
	
	@Column(name = "ANALYSIS_UPDATED_AT")
	private LocalDateTime analysisUpdatedAt;
	
	@PrePersist
	public void prePersist() {
		if(analysisCreatedAt == null) {
			analysisCreatedAt = LocalDateTime.now();
		}
	}
	
	@PreUpdate
	public void preUpdate() {
		analysisUpdatedAt = LocalDateTime.now();
	}
}
