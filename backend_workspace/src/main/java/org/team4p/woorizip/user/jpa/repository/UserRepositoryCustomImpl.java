package org.team4p.woorizip.user.jpa.repository;

import static org.team4p.woorizip.user.jpa.entity.QUserEntity.userEntity;

import java.util.Date;
import java.util.List;

import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.querydsl.core.types.dsl.Wildcard;
import com.querydsl.jpa.impl.JPAQueryFactory;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class UserRepositoryCustomImpl implements UserRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final EntityManager entityManager;

    @Override
    public UserEntity findByEmailId(String emailId) {
        return queryFactory
                .selectFrom(userEntity)
                .where(userEntity.emailId.eq(emailId))
                .fetchOne();
    }

    @Override
    public int updateDeletedYn(String userNo, int deletedYn) {
        // Native Query를 사용하여 탈퇴 여부 업데이트
        return entityManager.createNativeQuery(
                "UPDATE tb_users SET deleted_yn = :deletedYn, withdraw_at = NOW() WHERE user_no = :userNo")
                .setParameter("deletedYn", deletedYn)
                .setParameter("userNo", userNo)
                .executeUpdate();
    }

    @Override
    public long countSearchEmailId(String keyword) {
        return queryFactory
                .select(Wildcard.count)
                .from(userEntity)
                .where(userEntity.emailId.containsIgnoreCase(keyword))
                .fetchOne();
    }

    @Override
    public long countSearchName(String keyword) {
        return queryFactory
                .select(Wildcard.count)
                .from(userEntity)
                .where(userEntity.name.containsIgnoreCase(keyword))
                .fetchOne();
    }

    @Override
    public long countSearchType(String type) {
        return queryFactory
                .select(Wildcard.count)
                .from(userEntity)
                .where(userEntity.type.eq(type))
                .fetchOne();
    }

    @Override
    public long countSearchCreatedAt(Date begin, Date end) {
        return queryFactory
                .select(Wildcard.count)
                .from(userEntity)
                .where(userEntity.createdAt.between(begin, end))
                .fetchOne();
    }

    @Override
    public List<UserEntity> findBySearchEmailId(String keyword, Pageable pageable) {
        return queryFactory
                .selectFrom(userEntity)
                .where(userEntity.emailId.containsIgnoreCase(keyword))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

    @Override
    public List<UserEntity> findBySearchName(String keyword, Pageable pageable) {
        return queryFactory
                .selectFrom(userEntity)
                .where(userEntity.name.containsIgnoreCase(keyword))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

    @Override
    public List<UserEntity> findBySearchType(String type, Pageable pageable) {
        return queryFactory
                .selectFrom(userEntity)
                .where(userEntity.type.eq(type))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

    @Override
    public List<UserEntity> findBySearchCreatedAt(Date begin, Date end, Pageable pageable) {
        return queryFactory
                .selectFrom(userEntity)
                .where(userEntity.createdAt.between(begin, end))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }
}