package org.team4p.woorizip.facility.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QFacilityImageEntity is a Querydsl query type for FacilityImageEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFacilityImageEntity extends EntityPathBase<FacilityImageEntity> {

    private static final long serialVersionUID = 778078526L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QFacilityImageEntity facilityImageEntity = new QFacilityImageEntity("facilityImageEntity");

    public final NumberPath<Integer> facilityImageNo = createNumber("facilityImageNo", Integer.class);

    public final QFacilityEntity facilityNo;

    public final StringPath facilityOriginalImageName = createString("facilityOriginalImageName");

    public final StringPath facilityStoredImageName = createString("facilityStoredImageName");

    public QFacilityImageEntity(String variable) {
        this(FacilityImageEntity.class, forVariable(variable), INITS);
    }

    public QFacilityImageEntity(Path<? extends FacilityImageEntity> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QFacilityImageEntity(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QFacilityImageEntity(PathMetadata metadata, PathInits inits) {
        this(FacilityImageEntity.class, metadata, inits);
    }

    public QFacilityImageEntity(Class<? extends FacilityImageEntity> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.facilityNo = inits.isInitialized("facilityNo") ? new QFacilityEntity(forProperty("facilityNo")) : null;
    }

}

