package org.team4p.woorizip.room.image.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QRoomImageEntity is a Querydsl query type for RoomImageEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRoomImageEntity extends EntityPathBase<RoomImageEntity> {

    private static final long serialVersionUID = -1766413695L;

    public static final QRoomImageEntity roomImageEntity = new QRoomImageEntity("roomImageEntity");

    public final NumberPath<Integer> roomImageNo = createNumber("roomImageNo", Integer.class);

    public final StringPath roomNo = createString("roomNo");

    public final StringPath roomOriginalImageName = createString("roomOriginalImageName");

    public final StringPath roomStoredImageName = createString("roomStoredImageName");

    public QRoomImageEntity(String variable) {
        super(RoomImageEntity.class, forVariable(variable));
    }

    public QRoomImageEntity(Path<? extends RoomImageEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QRoomImageEntity(PathMetadata metadata) {
        super(RoomImageEntity.class, metadata);
    }

}

