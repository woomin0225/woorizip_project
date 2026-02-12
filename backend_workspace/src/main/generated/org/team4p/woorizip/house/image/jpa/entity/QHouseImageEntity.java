package org.team4p.woorizip.house.image.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QHouseImageEntity is a Querydsl query type for HouseImageEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QHouseImageEntity extends EntityPathBase<HouseImageEntity> {

    private static final long serialVersionUID = 627933445L;

    public static final QHouseImageEntity houseImageEntity = new QHouseImageEntity("houseImageEntity");

    public final NumberPath<Integer> houseImageNo = createNumber("houseImageNo", Integer.class);

    public final StringPath houseNo = createString("houseNo");

    public final StringPath houseOriginalImageName = createString("houseOriginalImageName");

    public final StringPath houseStoredImageName = createString("houseStoredImageName");

    public QHouseImageEntity(String variable) {
        super(HouseImageEntity.class, forVariable(variable));
    }

    public QHouseImageEntity(Path<? extends HouseImageEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QHouseImageEntity(PathMetadata metadata) {
        super(HouseImageEntity.class, metadata);
    }

}

