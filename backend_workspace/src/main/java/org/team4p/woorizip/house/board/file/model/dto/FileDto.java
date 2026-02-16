package org.team4p.woorizip.board.file.model.dto;

import org.team4p.woorizip.board.file.jpa.entity.FileEntity;

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
public class FileDto {

	private Integer fileNo;
	@NotNull
	private Integer postNo;
	@NotBlank
	private String originalFileName;
	@NotBlank
	private String updatedFileName;
	
	//Dto -> Entity
	public FileEntity toEntity() {
		return FileEntity.builder()
				.fileNo(this.fileNo)
				.postNo(this.postNo)
				.originalFileName(this.originalFileName)
				.updatedFileName(this.updatedFileName)
				.build();
	}
	
	//Entity -> Dto
	public static FileDto fromEntity(FileEntity entity) {
		if (entity == null) return null;
		
		return FileDto.builder()
				.fileNo(entity.getFileNo())
				.postNo(entity.getPostNo())
				.originalFileName(entity.getOriginalFileName())
				.updatedFileName(entity.getUpdatedFileName())
				.build();
	}
}
