package org.team4p.woorizip.house.view.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QHouseViewId is a Querydsl query type for HouseViewId
 */
@Generated("com.querydsl.codegen.DefaultEmbeddableSerializer")
public class QHouseViewId extends BeanPath<HouseViewId> {

    private static final long serialVersionUID = -1626144877L;

    public static final QHouseViewId houseViewId = new QHouseViewId("houseViewId");

    public final DateTimePath<java.time.LocalDateTime> hourStart = createDateTime("hourStart", java.time.LocalDateTime.class);

    public final StringPath houseNo = createString("houseNo");

    public QHouseViewId(String variable) {
        super(HouseViewId.class, forVariable(variable));
    }

    public QHouseViewId(Path<? extends HouseViewId> path) {
        super(path.getType(), path.getMetadata());
    }

    public QHouseViewId(PathMetadata metadata) {
        super(HouseViewId.class, metadata);
    }

}

