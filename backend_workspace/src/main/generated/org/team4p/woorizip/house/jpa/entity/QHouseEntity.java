package org.team4p.woorizip.house.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QHouseEntity is a Querydsl query type for HouseEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QHouseEntity extends EntityPathBase<HouseEntity> {

    private static final long serialVersionUID = 1891619881L;

    public static final QHouseEntity houseEntity = new QHouseEntity("houseEntity");

    public final BooleanPath deleted = createBoolean("deleted");

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final StringPath houseAbstract = createString("houseAbstract");

    public final StringPath houseAddress = createString("houseAddress");

    public final StringPath houseAddressDetail = createString("houseAddressDetail");

    public final NumberPath<Integer> houseCompletionYear = createNumber("houseCompletionYear", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> houseCreatedAt = createDateTime("houseCreatedAt", java.time.LocalDateTime.class);

    public final BooleanPath houseElevatorYn = createBoolean("houseElevatorYn");

    public final BooleanPath houseFemaleLimit = createBoolean("houseFemaleLimit");

    public final NumberPath<Integer> houseFloors = createNumber("houseFloors", Integer.class);

    public final NumberPath<Integer> houseHouseHolds = createNumber("houseHouseHolds", Integer.class);

    public final NumberPath<Integer> houseImageCount = createNumber("houseImageCount", Integer.class);

    public final NumberPath<Double> houseLat = createNumber("houseLat", Double.class);

    public final NumberPath<Double> houseLng = createNumber("houseLng", Double.class);

    public final StringPath houseName = createString("houseName");

    public final StringPath houseNo = createString("houseNo");

    public final NumberPath<Integer> houseParkingMax = createNumber("houseParkingMax", Integer.class);

    public final BooleanPath housePetYn = createBoolean("housePetYn");

    public final DateTimePath<java.time.LocalDateTime> houseUpdatedAt = createDateTime("houseUpdatedAt", java.time.LocalDateTime.class);

    public final StringPath houseZip = createString("houseZip");

    public final StringPath userNo = createString("userNo");

    public QHouseEntity(String variable) {
        super(HouseEntity.class, forVariable(variable));
    }

    public QHouseEntity(Path<? extends HouseEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QHouseEntity(PathMetadata metadata) {
        super(HouseEntity.class, metadata);
    }

}

