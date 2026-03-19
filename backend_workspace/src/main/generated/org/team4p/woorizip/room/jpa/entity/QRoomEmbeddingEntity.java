package org.team4p.woorizip.room.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QRoomEmbeddingEntity is a Querydsl query type for RoomEmbeddingEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRoomEmbeddingEntity extends EntityPathBase<RoomEmbeddingEntity> {

    private static final long serialVersionUID = 1702136138L;

    public static final QRoomEmbeddingEntity roomEmbeddingEntity = new QRoomEmbeddingEntity("roomEmbeddingEntity");

    public final StringPath embeddingStatus = createString("embeddingStatus");

    public final StringPath lastErrorMessage = createString("lastErrorMessage");

    public final NumberPath<Integer> retryCount = createNumber("retryCount", Integer.class);

    public final StringPath roomNo = createString("roomNo");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QRoomEmbeddingEntity(String variable) {
        super(RoomEmbeddingEntity.class, forVariable(variable));
    }

    public QRoomEmbeddingEntity(Path<? extends RoomEmbeddingEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QRoomEmbeddingEntity(PathMetadata metadata) {
        super(RoomEmbeddingEntity.class, metadata);
    }

}

