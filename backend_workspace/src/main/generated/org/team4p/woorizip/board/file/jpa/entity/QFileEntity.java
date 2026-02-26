package org.team4p.woorizip.board.file.jpa.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QFileEntity is a Querydsl query type for FileEntity
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFileEntity extends EntityPathBase<FileEntity> {

    private static final long serialVersionUID = -1253122947L;

    public static final QFileEntity fileEntity = new QFileEntity("fileEntity");

    public final NumberPath<Integer> fileNo = createNumber("fileNo", Integer.class);

    public final StringPath originalFileName = createString("originalFileName");

    public final NumberPath<Integer> postNo = createNumber("postNo", Integer.class);

    public final StringPath updatedFileName = createString("updatedFileName");

    public QFileEntity(String variable) {
        super(FileEntity.class, forVariable(variable));
    }

    public QFileEntity(Path<? extends FileEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QFileEntity(PathMetadata metadata) {
        super(FileEntity.class, metadata);
    }

}

