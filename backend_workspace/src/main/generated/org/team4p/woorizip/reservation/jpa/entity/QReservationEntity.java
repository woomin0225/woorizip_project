package org.team4p.woorizip.reservation.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QReservationEntity is a Querydsl query type for ReservationEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QReservationEntity extends EntityPathBase<ReservationEntity> {

    private static final long serialVersionUID = -618532311L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QReservationEntity reservationEntity = new QReservationEntity("reservationEntity");

    public final org.team4p.woorizip.facility.jpa.entity.QFacilityEntity facility;

    public final DateTimePath<java.time.LocalDateTime> reservationCanceledAt = createDateTime("reservationCanceledAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> reservationCreatedAt = createDateTime("reservationCreatedAt", java.time.LocalDateTime.class);

    public final DatePath<java.time.LocalDate> reservationDate = createDate("reservationDate", java.time.LocalDate.class);

    public final TimePath<java.time.LocalTime> reservationEndTime = createTime("reservationEndTime", java.time.LocalTime.class);

    public final StringPath reservationName = createString("reservationName");

    public final StringPath reservationNo = createString("reservationNo");

    public final StringPath reservationPhone = createString("reservationPhone");

    public final TimePath<java.time.LocalTime> reservationStartTime = createTime("reservationStartTime", java.time.LocalTime.class);

    public final EnumPath<org.team4p.woorizip.reservation.enums.ReservationStatus> reservationStatus = createEnum("reservationStatus", org.team4p.woorizip.reservation.enums.ReservationStatus.class);

    public final DateTimePath<java.time.LocalDateTime> reservationUpdatedAt = createDateTime("reservationUpdatedAt", java.time.LocalDateTime.class);

    public final org.team4p.woorizip.user.jpa.entity.QUserEntity user;

    public QReservationEntity(String variable) {
        this(ReservationEntity.class, forVariable(variable), INITS);
    }

    public QReservationEntity(Path<? extends ReservationEntity> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QReservationEntity(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QReservationEntity(PathMetadata metadata, PathInits inits) {
        this(ReservationEntity.class, metadata, inits);
    }

    public QReservationEntity(Class<? extends ReservationEntity> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.facility = inits.isInitialized("facility") ? new org.team4p.woorizip.facility.jpa.entity.QFacilityEntity(forProperty("facility"), inits.get("facility")) : null;
        this.user = inits.isInitialized("user") ? new org.team4p.woorizip.user.jpa.entity.QUserEntity(forProperty("user")) : null;
    }

}

