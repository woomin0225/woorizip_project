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

    public final BooleanPath deleted = createBoolean("deleted");

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final StringPath houseNo = createString("houseNo");

    public final StringPath roomAbstract = createString("roomAbstract");

    public final NumberPath<Double> roomArea = createNumber("roomArea", Double.class);

    public final DateTimePath<java.time.LocalDateTime> roomAvailableDate = createDateTime("roomAvailableDate", java.time.LocalDateTime.class);

    public final NumberPath<Integer> roomBathCount = createNumber("roomBathCount", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> roomCreatedAt = createDateTime("roomCreatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> roomDeposit = createNumber("roomDeposit", Integer.class);

    public final BooleanPath roomEmptyYn = createBoolean("roomEmptyYn");

    public final StringPath roomFacing = createString("roomFacing");

    public final NumberPath<Integer> roomImageCount = createNumber("roomImageCount", Integer.class);

    public final StringPath roomMethod = createString("roomMethod");

    public final NumberPath<Integer> roomMonthly = createNumber("roomMonthly", Integer.class);

    public final StringPath roomName = createString("roomName");

    public final StringPath roomNo = createString("roomNo");

    public final StringPath roomOptions = createString("roomOptions");

    public final NumberPath<Integer> roomRoomCount = createNumber("roomRoomCount", Integer.class);

    public final StringPath roomStatus = createString("roomStatus");

    public final DateTimePath<java.time.LocalDateTime> roomUpdatedAt = createDateTime("roomUpdatedAt", java.time.LocalDateTime.class);

    public final StringPath userNo = createString("userNo");

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

