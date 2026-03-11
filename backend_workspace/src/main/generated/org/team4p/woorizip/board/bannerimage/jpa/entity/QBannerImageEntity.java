package org.team4p.woorizip.board.bannerimage.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QBannerImageEntity is a Querydsl query type for BannerImageEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBannerImageEntity extends EntityPathBase<BannerImageEntity> {

    private static final long serialVersionUID = 1313428657L;

    public static final QBannerImageEntity bannerImageEntity = new QBannerImageEntity("bannerImageEntity");

    public final NumberPath<Integer> bannerImageNo = createNumber("bannerImageNo", Integer.class);

    public final DateTimePath<java.sql.Timestamp> fileCreatedAt = createDateTime("fileCreatedAt", java.sql.Timestamp.class);

    public final StringPath originalFileName = createString("originalFileName");

    public final NumberPath<Integer> postNo = createNumber("postNo", Integer.class);

    public final StringPath updatedFileName = createString("updatedFileName");

    public QBannerImageEntity(String variable) {
        super(BannerImageEntity.class, forVariable(variable));
    }

    public QBannerImageEntity(Path<? extends BannerImageEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QBannerImageEntity(PathMetadata metadata) {
        super(BannerImageEntity.class, metadata);
    }

}

