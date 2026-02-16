package org.team4p.woorizip.board.comment.jpa.entity;

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
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(name = "tb_comments")
@Entity
public class CommentEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "COMMENT_NO", nullable = false)
	private Integer commentNo;
	@Column(name = "POST_NO", nullable = false)
	private Integer postNo;
	@Column(name = "PARENT_COMMENT_NO")
	private Integer parentCommentNo;
	@Column(name = "USER_NO", nullable = false, length = 36)
	private String userNo;
	@Column(name = "COMMENT_CONTENT", nullable = false, columnDefinition = "TEXT")
	private String commentContent;
	@Column(name = "COMMENT_LEV")
	private Integer commentLev;
	@Column(name = "COMMENT_SEQ")
	private Integer commentSeq;
	@Column(name = "COMMENT_CREATED_AT", 
			nullable = false,
			insertable = false,
			updatable = false)
	private Timestamp commentCreatedAt;
	@Column(name = "COMMENT_UPDATED_AT",
			insertable = false,
			updatable = false)
	private Timestamp commentUpdatedAt;
	
	@PrePersist
	public void prePersist() {
		
		if(commentLev == null) {
			commentLev = 1;
		}
		
		if(commentSeq == null) {
			commentSeq = 1;
		}
	}
}
