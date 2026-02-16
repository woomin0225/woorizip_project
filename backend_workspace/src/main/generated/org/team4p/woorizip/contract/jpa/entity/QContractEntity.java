package org.team4p.woorizip.contract.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QContractEntity is a Querydsl query type for ContractEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QContractEntity extends EntityPathBase<ContractEntity> {

    private static final long serialVersionUID = -2046900063L;

    public static final QContractEntity contractEntity = new QContractEntity("contractEntity");

    public final StringPath contractNo = createString("contractNo");

    public final StringPath contractStatus = createString("contractStatus");

    public final StringPath contractUrl = createString("contractUrl");

    public final DatePath<java.util.Date> moveInDate = createDate("moveInDate", java.util.Date.class);

    public final DateTimePath<java.sql.Timestamp> paymentDate = createDateTime("paymentDate", java.sql.Timestamp.class);

    public final StringPath roomNo = createString("roomNo");

    public final NumberPath<Integer> termMonths = createNumber("termMonths", Integer.class);

    public final StringPath userNo = createString("userNo");

    public QContractEntity(String variable) {
        super(ContractEntity.class, forVariable(variable));
    }

    public QContractEntity(Path<? extends ContractEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QContractEntity(PathMetadata metadata) {
        super(ContractEntity.class, metadata);
    }

}

