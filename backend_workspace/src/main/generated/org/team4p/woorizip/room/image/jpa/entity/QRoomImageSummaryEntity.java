package org.team4p.woorizip.room.image.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QRoomImageSummaryEntity is a Querydsl query type for RoomImageSummaryEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRoomImageSummaryEntity extends EntityPathBase<RoomImageSummaryEntity> {

    private static final long serialVersionUID = 357617355L;

    public static final QRoomImageSummaryEntity roomImageSummaryEntity = new QRoomImageSummaryEntity("roomImageSummaryEntity");

    public final NumberPath<Integer> imageCount = createNumber("imageCount", Integer.class);

    public final StringPath imageSummary = createString("imageSummary");

    public final StringPath lastErrorMessage = createString("lastErrorMessage");

    public final NumberPath<Integer> retryCount = createNumber("retryCount", Integer.class);

    public final StringPath roomNo = createString("roomNo");

    public final StringPath summaryStatus = createString("summaryStatus");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QRoomImageSummaryEntity(String variable) {
        super(RoomImageSummaryEntity.class, forVariable(variable));
    }

    public QRoomImageSummaryEntity(Path<? extends RoomImageSummaryEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QRoomImageSummaryEntity(PathMetadata metadata) {
        super(RoomImageSummaryEntity.class, metadata);
    }

}

