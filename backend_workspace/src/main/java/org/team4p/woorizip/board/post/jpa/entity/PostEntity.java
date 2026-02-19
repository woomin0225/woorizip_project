package org.team4p.woorizip.board.post.jpa.entity;

import java.sql.Timestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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
@Table(name = "tb_posts")
@Entity
public class PostEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "POST_NO", nullable = false)
  private Integer postNo;
  @Column(name = "BOARD_TYPE_NO", nullable = false, length = 36)
  private String boardTypeNo;
  @Column(name = "USER_NO", nullable = false, length = 36)
  private String userNo;
  @Column(name = "POST_TITLE", nullable = false, length = 255)
  private String postTitle;
  @Column(name = "POST_CONTENT", nullable = false, columnDefinition = "TEXT")
  private String postContent;
  @Column(name = "POST_VIEW_COUNT", nullable = false)
  private int postViewCount;
  @Column(name = "POST_CREATED_AT", nullable = false)
  private Timestamp postCreatedAt;
  @Column(name = "POST_UPDATED_AT")
  private Timestamp postUpdatedAt;
  @Column(name = "POST_COMMENT_YN")
  private Boolean postCommentYn;
  @Column(name = "POST_FILE_YN")
  private Boolean postFileYn;

  //Insert 직전 기본값 세팅
  @PrePersist
  public void prePersist() {
    Timestamp now = new Timestamp(System.currentTimeMillis());

    if (postCreatedAt == null) {
        postCreatedAt = now;
    }
    if (postViewCount < 0) {
        postViewCount = 0;
    }
    if (postCommentYn == null) {
        postCommentYn = false;
    }
    if (postFileYn == null) {
        postFileYn = false;
    }
  }


  //Update 직전 기본값 세팅
  @PreUpdate
  public void preUpdate() {
    postUpdatedAt = new Timestamp(System.currentTimeMillis());
  }
}
