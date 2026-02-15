package org.team4p.woorizip.facility.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QFacilityEntity is a Querydsl query type for FacilityEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFacilityEntity extends EntityPathBase<FacilityEntity> {

    private static final long serialVersionUID = -1254125629L;

    public static final QFacilityEntity facilityEntity = new QFacilityEntity("facilityEntity");

    public final NumberPath<Integer> facilityCapacity = createNumber("facilityCapacity", Integer.class);

    public final TimePath<java.time.LocalTime> facilityCloseTime = createTime("facilityCloseTime", java.time.LocalTime.class);

    public final DateTimePath<java.time.LocalDateTime> facilityCreatedAt = createDateTime("facilityCreatedAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> facilityDeletedAt = createDateTime("facilityDeletedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> facilityLocation = createNumber("facilityLocation", Integer.class);

    public final NumberPath<Integer> facilityMaxDurationMinutes = createNumber("facilityMaxDurationMinutes", Integer.class);

    public final StringPath facilityName = createString("facilityName");

    public final StringPath facilityNo = createString("facilityNo");

    public final TimePath<java.time.LocalTime> facilityOpenTime = createTime("facilityOpenTime", java.time.LocalTime.class);

    public final MapPath<String, Boolean, BooleanPath> facilityOptionInfo = this.<String, Boolean, BooleanPath>createMap("facilityOptionInfo", String.class, Boolean.class, BooleanPath.class);

    public final BooleanPath facilityRsvnRequiredYn = createBoolean("facilityRsvnRequiredYn");

    public final NumberPath<Integer> facilityRsvnUnitMinutes = createNumber("facilityRsvnUnitMinutes", Integer.class);

    public final EnumPath<org.team4p.woorizip.facility.enums.FacilityStatus> facilityStatus = createEnum("facilityStatus", org.team4p.woorizip.facility.enums.FacilityStatus.class);

    public final DateTimePath<java.time.LocalDateTime> facilityUpdatedAt = createDateTime("facilityUpdatedAt", java.time.LocalDateTime.class);

    public final StringPath houseNo = createString("houseNo");

    public final ListPath<FacilityImageEntity, QFacilityImageEntity> images = this.<FacilityImageEntity, QFacilityImageEntity>createList("images", FacilityImageEntity.class, QFacilityImageEntity.class, PathInits.DIRECT2);

    public final NumberPath<Integer> maxRsvnPerDay = createNumber("maxRsvnPerDay", Integer.class);

    public QFacilityEntity(String variable) {
        super(FacilityEntity.class, forVariable(variable));
    }

    public QFacilityEntity(Path<? extends FacilityEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QFacilityEntity(PathMetadata metadata) {
        super(FacilityEntity.class, metadata);
    }

}

