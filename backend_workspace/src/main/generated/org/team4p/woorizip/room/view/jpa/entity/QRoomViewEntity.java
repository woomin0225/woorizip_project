package org.team4p.woorizip.room.view.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRoomViewEntity is a Querydsl query type for RoomViewEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRoomViewEntity extends EntityPathBase<RoomViewEntity> {

    private static final long serialVersionUID = -1157290475L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRoomViewEntity roomViewEntity = new QRoomViewEntity("roomViewEntity");

    public final QRoomViewId id;

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> viewCount = createNumber("viewCount", Long.class);

    public QRoomViewEntity(String variable) {
        this(RoomViewEntity.class, forVariable(variable), INITS);
    }

    public QRoomViewEntity(Path<? extends RoomViewEntity> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRoomViewEntity(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRoomViewEntity(PathMetadata metadata, PathInits inits) {
        this(RoomViewEntity.class, metadata, inits);
    }

    public QRoomViewEntity(Class<? extends RoomViewEntity> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.id = inits.isInitialized("id") ? new QRoomViewId(forProperty("id")) : null;
    }

}

