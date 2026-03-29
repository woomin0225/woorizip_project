package org.team4p.woorizip.room.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QRoomFinalSummaryEntity is a Querydsl query type for RoomFinalSummaryEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRoomFinalSummaryEntity extends EntityPathBase<RoomFinalSummaryEntity> {

    private static final long serialVersionUID = 2095481891L;

    public static final QRoomFinalSummaryEntity roomFinalSummaryEntity = new QRoomFinalSummaryEntity("roomFinalSummaryEntity");

    public final StringPath finalSummary = createString("finalSummary");

    public final StringPath lastErrorMessage = createString("lastErrorMessage");

    public final NumberPath<Integer> retryCount = createNumber("retryCount", Integer.class);

    public final StringPath roomNo = createString("roomNo");

    public final StringPath summaryStatus = createString("summaryStatus");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QRoomFinalSummaryEntity(String variable) {
        super(RoomFinalSummaryEntity.class, forVariable(variable));
    }

    public QRoomFinalSummaryEntity(Path<? extends RoomFinalSummaryEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QRoomFinalSummaryEntity(PathMetadata metadata) {
        super(RoomFinalSummaryEntity.class, metadata);
    }

}

