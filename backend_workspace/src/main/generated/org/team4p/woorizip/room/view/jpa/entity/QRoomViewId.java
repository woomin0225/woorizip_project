package org.team4p.woorizip.room.view.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QRoomViewId is a Querydsl query type for RoomViewId
 */
@Generated("com.querydsl.codegen.DefaultEmbeddableSerializer")
public class QRoomViewId extends BeanPath<RoomViewId> {

    private static final long serialVersionUID = -1582024627L;

    public static final QRoomViewId roomViewId = new QRoomViewId("roomViewId");

    public final DateTimePath<java.time.LocalDateTime> hourStart = createDateTime("hourStart", java.time.LocalDateTime.class);

    public final StringPath roomNo = createString("roomNo");

    public QRoomViewId(String variable) {
        super(RoomViewId.class, forVariable(variable));
    }

    public QRoomViewId(Path<? extends RoomViewId> path) {
        super(path.getType(), path.getMetadata());
    }

    public QRoomViewId(PathMetadata metadata) {
        super(RoomViewId.class, metadata);
    }

}

