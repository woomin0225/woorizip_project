package board.post.model.dto;

import java.sql.Timestamp;

import com.fasterxml.jackson.annotation.JsonFormat;

import board.post.jpa.entity.PostEntity;
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
public class PostDto {

  public interface Create {}
  public interface Update {}

  @NotNull(groups = Update.class)
  @Min(value = 1, groups = Update.class)
  private Integer postNo;
  @NotBlank(groups = {Create.class, Update.class})
  private String boardTypeNo;
  @NotBlank(groups = {Create.class, Update.class})
  private String userNo;
  @NotBlank(groups = {Create.class, Update.class})
  @Size(max = 255)
  private String postTitle;
  @NotBlank(groups = {Create.class, Update.class})
  private String postContent;
  private int postViewCount;
  @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
  private Timestamp postCreatedAt;
  @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
  private Timestamp postUpdatedAt;
  private Boolean postCommentYn;
  private Boolean postFileYn;

  //dto -> entity
  public PostEntity toEntity() {
    return PostEntity.builder()
        .postNo(this.postNo)
        .boardTypeNo(this.boardTypeNo)
        .userNo(this.userNo)
        .postTitle(this.postTitle)
        .postContent(this.postContent)
        .postViewCount(this.postViewCount)
        .postCreatedAt(this.postCreatedAt)
        .postUpdatedAt(this.postUpdatedAt)
        .postCommentYn(this.postCommentYn)
        .postFileYn(this.postFileYn)
        .build();
  }

  //entity -> dto
  public static PostDto fromEntity(PostEntity entity) {
    if (entity == null) return null;
    
    return PostDto.builder()
        .postNo(entity.getPostNo())
        .boardTypeNo(entity.getBoardTypeNo())
        .userNo(entity.getUserNo())
        .postTitle(entity.getPostTitle())
        .postContent(entity.getPostContent())
        .postViewCount(entity.getPostViewCount())
        .postCreatedAt(entity.getPostCreatedAt())
        .postUpdatedAt(entity.getPostUpdatedAt())
        .postCommentYn(entity.getPostCommentYn())
        .postFileYn(entity.getPostFileYn())
        .build();
  }
}
