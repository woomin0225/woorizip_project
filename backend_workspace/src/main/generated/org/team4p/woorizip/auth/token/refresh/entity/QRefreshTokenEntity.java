package org.team4p.woorizip.auth.token.refresh.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QRefreshTokenEntity is a Querydsl query type for RefreshTokenEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRefreshTokenEntity extends EntityPathBase<RefreshTokenEntity> {

    private static final long serialVersionUID = 918437454L;

    public static final QRefreshTokenEntity refreshTokenEntity = new QRefreshTokenEntity("refreshTokenEntity");

    public final DateTimePath<java.time.LocalDateTime> expiresAt = createDateTime("expiresAt", java.time.LocalDateTime.class);

    public final StringPath id = createString("id");

    public final DateTimePath<java.time.LocalDateTime> issuedAt = createDateTime("issuedAt", java.time.LocalDateTime.class);

    public final BooleanPath revoked = createBoolean("revoked");

    public final StringPath tokenValue = createString("tokenValue");

    public final StringPath userId = createString("userId");

    public QRefreshTokenEntity(String variable) {
        super(RefreshTokenEntity.class, forVariable(variable));
    }

    public QRefreshTokenEntity(Path<? extends RefreshTokenEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QRefreshTokenEntity(PathMetadata metadata) {
        super(RefreshTokenEntity.class, metadata);
    }

}

