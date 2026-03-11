package org.team4p.woorizip.board.bannerimage.jpa.entity;

import java.sql.Timestamp;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@Entity
@Table(name = "tb_banner_images")
public class BannerImageEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "BANNER_IMAGE_NO", nullable = false)
	private Integer bannerImageNo;
	@Column(name = "POST_NO", nullable = false, unique = true)
	private Integer postNo;
	@Column(name = "ORIGINAL_FILE_NAME", nullable = false, length = 255)
	private String originalFileName;
	@Column(name = "UPDATED_FILE_NAME", nullable = false, length = 255)
	private String updatedFileName;
	@Column(name = "FILE_CREATED_AT", nullable = false)
	private Timestamp fileCreatedAt;
	
	@PrePersist
	public void prePersist() {
		if(fileCreatedAt == null) {
			fileCreatedAt = new Timestamp(System.currentTimeMillis());
		}
	}
}
