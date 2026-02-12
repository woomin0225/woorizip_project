package org.team4p.woorizip.board.post.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QPostEntity is a Querydsl query type for PostEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPostEntity extends EntityPathBase<PostEntity> {

    private static final long serialVersionUID = 318735557L;

    public static final QPostEntity postEntity = new QPostEntity("postEntity");

    public final StringPath boardTypeNo = createString("boardTypeNo");

    public final BooleanPath postCommentYn = createBoolean("postCommentYn");

    public final StringPath postContent = createString("postContent");

    public final DateTimePath<java.sql.Timestamp> postCreatedAt = createDateTime("postCreatedAt", java.sql.Timestamp.class);

    public final BooleanPath postFileYn = createBoolean("postFileYn");

    public final NumberPath<Integer> postNo = createNumber("postNo", Integer.class);

    public final StringPath postTitle = createString("postTitle");

    public final DateTimePath<java.sql.Timestamp> postUpdatedAt = createDateTime("postUpdatedAt", java.sql.Timestamp.class);

    public final NumberPath<Integer> postViewCount = createNumber("postViewCount", Integer.class);

    public final StringPath userNo = createString("userNo");

    public QPostEntity(String variable) {
        super(PostEntity.class, forVariable(variable));
    }

    public QPostEntity(Path<? extends PostEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QPostEntity(PathMetadata metadata) {
        super(PostEntity.class, metadata);
    }

}

