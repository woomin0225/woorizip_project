package org.team4p.woorizip.room.review.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QReviewEntity is a Querydsl query type for ReviewEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReviewEntity extends EntityPathBase<ReviewEntity> {

    private static final long serialVersionUID = 1624194240L;

    public static final QReviewEntity reviewEntity = new QReviewEntity("reviewEntity");

    public final NumberPath<Integer> rating = createNumber("rating", Integer.class);

    public final StringPath reviewContent = createString("reviewContent");

    public final DateTimePath<java.time.LocalDateTime> reviewCreatedAt = createDateTime("reviewCreatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> reviewNo = createNumber("reviewNo", Integer.class);

    public final StringPath roomNo = createString("roomNo");

    public final StringPath userNo = createString("userNo");

    public QReviewEntity(String variable) {
        super(ReviewEntity.class, forVariable(variable));
    }

    public QReviewEntity(Path<? extends ReviewEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QReviewEntity(PathMetadata metadata) {
        super(ReviewEntity.class, metadata);
    }

}

