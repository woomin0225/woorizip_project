package org.team4p.woorizip.user.jpa.repository;

import static org.team4p.woorizip.user.jpa.entity.QUserEntity.userEntity;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.model.dto.UserDto;
import com.querydsl.core.types.dsl.BooleanExpression;
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
    public UserEntity findByEmailId(String email_id) {
        return queryFactory
                .selectFrom(userEntity)
                .where(userEntity.emailId.eq(email_id))
                .fetchOne();
    }

    @Override
    public UserEntity findByNameAndPhone(String name, String phone) {
        return queryFactory
                .selectFrom(userEntity)
                .where(
                    userEntity.name.eq(name),
                    userEntity.phone.eq(phone),
                    userEntity.deletedYn.eq("N")
                )
                .orderBy(userEntity.createdAt.desc(), userEntity.userNo.desc())
                .fetchFirst();
    }

    @Override
    public long countSearchList(UserDto user_dto) {
        return queryFactory
                .select(Wildcard.count)
                .from(userEntity)
                .where(
                    emailContains(user_dto.getEmailId()),
                    nameContains(user_dto.getName()),
                    phoneContains(user_dto.getPhone())
                )
                .fetchOne();
    }

    @Override
    public List<UserEntity> findBySearchList(UserDto user_dto, Pageable pageable) {
        return queryFactory
                .selectFrom(userEntity)
                .where(
                    emailContains(user_dto.getEmailId()),
                    nameContains(user_dto.getName()),
                    phoneContains(user_dto.getPhone())
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

    private BooleanExpression emailContains(String email) {
        return email != null && !email.isEmpty() ? userEntity.emailId.containsIgnoreCase(email) : null;
    }

    private BooleanExpression nameContains(String name) {
        return name != null && !name.isEmpty() ? userEntity.name.containsIgnoreCase(name) : null;
    }

    private BooleanExpression phoneContains(String phone) {
        return phone != null && !phone.isEmpty() ? userEntity.phone.contains(phone) : null;
    }
}
