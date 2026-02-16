package org.team4p.woorizip.board.comment.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QCommentEntity is a Querydsl query type for CommentEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QCommentEntity extends EntityPathBase<CommentEntity> {

    private static final long serialVersionUID = -133696943L;

    public static final QCommentEntity commentEntity = new QCommentEntity("commentEntity");

    public final StringPath commentContent = createString("commentContent");

    public final DateTimePath<java.sql.Timestamp> commentCreatedAt = createDateTime("commentCreatedAt", java.sql.Timestamp.class);

    public final NumberPath<Integer> commentLev = createNumber("commentLev", Integer.class);

    public final NumberPath<Integer> commentNo = createNumber("commentNo", Integer.class);

    public final NumberPath<Integer> commentSeq = createNumber("commentSeq", Integer.class);

    public final DateTimePath<java.sql.Timestamp> commentUpdatedAt = createDateTime("commentUpdatedAt", java.sql.Timestamp.class);

    public final NumberPath<Integer> parentCommentNo = createNumber("parentCommentNo", Integer.class);

    public final NumberPath<Integer> postNo = createNumber("postNo", Integer.class);

    public final StringPath userNo = createString("userNo");

    public QCommentEntity(String variable) {
        super(CommentEntity.class, forVariable(variable));
    }

    public QCommentEntity(Path<? extends CommentEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QCommentEntity(PathMetadata metadata) {
        super(CommentEntity.class, metadata);
    }

}

