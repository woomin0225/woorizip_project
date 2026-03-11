package org.team4p.woorizip.wishlist.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QWishlistEntity is a Querydsl query type for WishlistEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QWishlistEntity extends EntityPathBase<WishlistEntity> {

    private static final long serialVersionUID = -76139001L;

    public static final QWishlistEntity wishlistEntity = new QWishlistEntity("wishlistEntity");

    public final DatePath<java.sql.Date> createdAt = createDate("createdAt", java.sql.Date.class);

    public final StringPath roomNo = createString("roomNo");

    public final StringPath userNo = createString("userNo");

    public final StringPath wishNo = createString("wishNo");

    public QWishlistEntity(String variable) {
        super(WishlistEntity.class, forVariable(variable));
    }

    public QWishlistEntity(Path<? extends WishlistEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QWishlistEntity(PathMetadata metadata) {
        super(WishlistEntity.class, metadata);
    }

}

