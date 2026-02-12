package org.team4p.woorizip.board.comment.model.dto;

import java.sql.Timestamp;
import java.util.List;

import org.team4p.woorizip.board.comment.jpa.entity.CommentEntity;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CommentDto {

	public interface Create {}
	public interface Update {}
	
	@NotNull(groups = Update.class)
	private Integer commentNo;
	@NotNull(groups = Create.class)
	@Min(value = 1)
	private Integer postNo;
	private Integer parentCommentNo;
	@NotBlank(groups = {Create.class, Update.class})
	@Size(max = 36)
	private String userNo;
	@NotBlank(groups = {Create.class, Update.class})
	@Size(max = 2000)
	private String commentContent;
	@Min(value = 1)
	private Integer commentLev;
	private Integer commentSeq;
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone ="Asia/Seoul")
	private Timestamp commentCreatedAt;
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone ="Asia/Seoul")
	private Timestamp commentUpdatedAt;
	private List<CommentDto> children;
	
	//Dto -> Entity
	public CommentEntity toEntity() {
		return CommentEntity.builder()
				.commentNo(this.commentNo)
				.postNo(this.postNo)
				.parentCommentNo(this.parentCommentNo)
				.userNo(this.userNo)
				.commentContent(this.commentContent)
				.commentLev(this.commentLev)
				.commentSeq(this.commentSeq)
				.commentCreatedAt(this.commentCreatedAt)
				.commentUpdatedAt(this.commentUpdatedAt)
				.build();
	}
	
	//Entity -> Dto
	public static CommentDto fromEntity(CommentEntity entity) {
		if(entity == null) return null;
		
		return CommentDto.builder()
				.commentNo(entity.getCommentNo())
				.postNo(entity.getPostNo())
				.parentCommentNo(entity.getParentCommentNo())
				.userNo(entity.getUserNo())
				.commentContent(entity.getCommentContent())
				.commentLev(entity.getCommentLev())
				.commentSeq(entity.getCommentSeq())
				.commentCreatedAt(entity.getCommentCreatedAt())
				.commentUpdatedAt(entity.getCommentUpdatedAt())
				.build();
	}
}