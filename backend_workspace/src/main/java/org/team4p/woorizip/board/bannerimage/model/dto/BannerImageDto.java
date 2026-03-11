package org.team4p.woorizip.board.bannerimage.model.dto;

import java.sql.Timestamp;

import org.team4p.woorizip.board.bannerimage.jpa.entity.BannerImageEntity;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerImageDto {
	
	public interface Create {}
	public interface Update {}
	
	@NotNull(groups = Update.class)
	@Min(value = 1, groups = Update.class)
	private Integer bannerImageNo;
	@NotNull(groups = {Create.class})
	private Integer postNo;
	@NotBlank(groups = {Create.class})	
	private String originalFileName;
	@NotBlank(groups = {Create.class})
	private String updatedFileName;
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
	private Timestamp fileCreatedAt;
	
	//Dto -> Entity ================================
	public BannerImageEntity toEntity() {
		return BannerImageEntity.builder()
				.bannerImageNo(this.bannerImageNo)
				.postNo(this.postNo)
				.originalFileName(this.originalFileName)
				.updatedFileName(this.updatedFileName)
				.fileCreatedAt(this.fileCreatedAt)
				.build();
	}
	
	//Entity -> Dto ================================
	public static BannerImageDto fromEntity(BannerImageEntity entity) {
		if(entity == null) return null;
		
		return BannerImageDto.builder()
				.bannerImageNo(entity.getBannerImageNo())
				.postNo(entity.getPostNo())
				.originalFileName(entity.getOriginalFileName())
				.updatedFileName(entity.getUpdatedFileName())
				.fileCreatedAt(entity.getFileCreatedAt())
				.build();
	}

}
