package org.team4p.woorizip.room.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QRoomEntity is a Querydsl query type for RoomEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRoomEntity extends EntityPathBase<RoomEntity> {

    private static final long serialVersionUID = -1164017997L;

    public static final QRoomEntity roomEntity = new QRoomEntity("roomEntity");

    public QRoomEntity(String variable) {
        super(RoomEntity.class, forVariable(variable));
    }

    public QRoomEntity(Path<? extends RoomEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QRoomEntity(PathMetadata metadata) {
        super(RoomEntity.class, metadata);
    }

}

