package org.team4p.woorizip.tour.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QTourEntity is a Querydsl query type for TourEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QTourEntity extends EntityPathBase<TourEntity> {

    private static final long serialVersionUID = 2041287725L;

    public static final QTourEntity tourEntity = new QTourEntity("tourEntity");

    public final StringPath canceledReason = createString("canceledReason");

    public final StringPath message = createString("message");

    public final StringPath roomNo = createString("roomNo");

    public final DateTimePath<java.util.Date> tourCanceledAt = createDateTime("tourCanceledAt", java.util.Date.class);

    public final StringPath tourNo = createString("tourNo");

    public final StringPath tourStatus = createString("tourStatus");

    public final StringPath userNo = createString("userNo");

    public final DatePath<java.util.Date> visitDate = createDate("visitDate", java.util.Date.class);

    public final StringPath visitTime = createString("visitTime");

    public QTourEntity(String variable) {
        super(TourEntity.class, forVariable(variable));
    }

    public QTourEntity(Path<? extends TourEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QTourEntity(PathMetadata metadata) {
        super(TourEntity.class, metadata);
    }

}

