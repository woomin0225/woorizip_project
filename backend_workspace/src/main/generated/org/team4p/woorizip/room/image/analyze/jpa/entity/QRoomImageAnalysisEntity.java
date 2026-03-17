package org.team4p.woorizip.room.image.analyze.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QRoomImageAnalysisEntity is a Querydsl query type for RoomImageAnalysisEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRoomImageAnalysisEntity extends EntityPathBase<RoomImageAnalysisEntity> {

    private static final long serialVersionUID = -857074593L;

    public static final QRoomImageAnalysisEntity roomImageAnalysisEntity = new QRoomImageAnalysisEntity("roomImageAnalysisEntity");

    public final DateTimePath<java.time.LocalDateTime> analysisCreatedAt = createDateTime("analysisCreatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> analysisNo = createNumber("analysisNo", Long.class);

    public final DateTimePath<java.time.LocalDateTime> analysisUpdatedAt = createDateTime("analysisUpdatedAt", java.time.LocalDateTime.class);

    public final StringPath caption = createString("caption");

    public final StringPath normalizedOptions = createString("normalizedOptions");

    public final StringPath ocrText = createString("ocrText");

    public final StringPath rawJson = createString("rawJson");

    public final NumberPath<Integer> roomImageNo = createNumber("roomImageNo", Integer.class);

    public final StringPath roomNo = createString("roomNo");

    public final StringPath summary = createString("summary");

    public QRoomImageAnalysisEntity(String variable) {
        super(RoomImageAnalysisEntity.class, forVariable(variable));
    }

    public QRoomImageAnalysisEntity(Path<? extends RoomImageAnalysisEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QRoomImageAnalysisEntity(PathMetadata metadata) {
        super(RoomImageAnalysisEntity.class, metadata);
    }

}

