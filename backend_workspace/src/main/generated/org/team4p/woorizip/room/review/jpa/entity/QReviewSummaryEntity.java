package org.team4p.woorizip.room.review.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QReviewSummaryEntity is a Querydsl query type for ReviewSummaryEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReviewSummaryEntity extends EntityPathBase<ReviewSummaryEntity> {

    private static final long serialVersionUID = 1010436012L;

    public static final QReviewSummaryEntity reviewSummaryEntity = new QReviewSummaryEntity("reviewSummaryEntity");

    public final StringPath lastErrorMessage = createString("lastErrorMessage");

    public final NumberPath<Integer> retryCount = createNumber("retryCount", Integer.class);

    public final NumberPath<Integer> reviewCount = createNumber("reviewCount", Integer.class);

    public final StringPath reviewSummary = createString("reviewSummary");

    public final StringPath roomNo = createString("roomNo");

    public final StringPath summaryStatus = createString("summaryStatus");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QReviewSummaryEntity(String variable) {
        super(ReviewSummaryEntity.class, forVariable(variable));
    }

    public QReviewSummaryEntity(Path<? extends ReviewSummaryEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QReviewSummaryEntity(PathMetadata metadata) {
        super(ReviewSummaryEntity.class, metadata);
    }

}

