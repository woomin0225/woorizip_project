package org.team4p.woorizip.facility.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QFacilityCategoryEntity is a Querydsl query type for FacilityCategoryEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFacilityCategoryEntity extends EntityPathBase<FacilityCategoryEntity> {

    private static final long serialVersionUID = -1994448287L;

    public static final QFacilityCategoryEntity facilityCategoryEntity = new QFacilityCategoryEntity("facilityCategoryEntity");

    public final NumberPath<Integer> facilityCode = createNumber("facilityCode", Integer.class);

    public final MapPath<String, Boolean, BooleanPath> facilityOptions = this.<String, Boolean, BooleanPath>createMap("facilityOptions", String.class, Boolean.class, BooleanPath.class);

    public final StringPath facilityType = createString("facilityType");

    public QFacilityCategoryEntity(String variable) {
        super(FacilityCategoryEntity.class, forVariable(variable));
    }

    public QFacilityCategoryEntity(Path<? extends FacilityCategoryEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QFacilityCategoryEntity(PathMetadata metadata) {
        super(FacilityCategoryEntity.class, metadata);
    }

}

