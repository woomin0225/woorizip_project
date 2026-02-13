package org.team4p.woorizip.board.file.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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
@Table(name = "tb_files")
@Entity
public class FileEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "FILE_NO", nullable = false)
	private Integer fileNo;
	@Column(name = "POST_NO", nullable = false)
	private Integer postNo;
	@Column(name = "ORIGINAL_FILE_NAME", nullable = false, length = 255)
	private String originalFileName;
	@Column(name = "UPDATED_FILE_NAME", nullable = false, length = 255)
	private String updatedFileName;
	
}
