package org.team4p.woorizip.house.view.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QHouseViewEntity is a Querydsl query type for HouseViewEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QHouseViewEntity extends EntityPathBase<HouseViewEntity> {

    private static final long serialVersionUID = -779953573L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QHouseViewEntity houseViewEntity = new QHouseViewEntity("houseViewEntity");

    public final QHouseViewId id;

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> viewCount = createNumber("viewCount", Long.class);

    public QHouseViewEntity(String variable) {
        this(HouseViewEntity.class, forVariable(variable), INITS);
    }

    public QHouseViewEntity(Path<? extends HouseViewEntity> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QHouseViewEntity(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QHouseViewEntity(PathMetadata metadata, PathInits inits) {
        this(HouseViewEntity.class, metadata, inits);
    }

    public QHouseViewEntity(Class<? extends HouseViewEntity> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.id = inits.isInitialized("id") ? new QHouseViewId(forProperty("id")) : null;
    }

}

