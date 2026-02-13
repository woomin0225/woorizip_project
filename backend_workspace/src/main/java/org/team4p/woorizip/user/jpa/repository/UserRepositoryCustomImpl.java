package org.team4p.woorizip.user.jpa.repository;

import static org.team4p.woorizip.user.jpa.entity.QUserEntity.userEntity;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.model.dto.UserDto;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
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

    /**
     * 통합 검색 결과 개수 조회
     */
    @Override
    public long countSearchList(UserDto user_dto) {
        return queryFactory
                .select(Wildcard.count)
                .from(userEntity)
                .where(
                    // allCond 대신 조건을 쉼표로 나열
                    emailContains(user_dto.getEmailId()),
                    nameContains(user_dto.getName()),
                    phoneContains(user_dto.getPhone()),
                    genderEq(user_dto.getGender()),
                    ageEq(user_dto.getAge())
                )
                .fetchOne();
    }

    /**
     * 통합 검색 결과 목록 조회 (페이징 포함)
     */
    @Override
    public List<UserEntity> findBySearchList(UserDto user_dto, Pageable pageable) {
        return queryFactory
                .selectFrom(userEntity)
                .where(
                    emailContains(user_dto.getEmailId()),
                    nameContains(user_dto.getName()),
                    phoneContains(user_dto.getPhone()),
                    genderEq(user_dto.getGender()),
                    ageEq(user_dto.getAge())
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

    // --- 동적 쿼리용 조건 메서드 ---


    private BooleanExpression emailContains(String email) {
        return email != null && !email.isEmpty() ? userEntity.emailId.containsIgnoreCase(email) : null;
    }

    private BooleanExpression nameContains(String name) {
        return name != null && !name.isEmpty() ? userEntity.name.containsIgnoreCase(name) : null;
    }

    private BooleanExpression phoneContains(String phone) {
        return phone != null && !phone.isEmpty() ? userEntity.phone.contains(phone) : null;
    }

    private BooleanExpression genderEq(String gender) {
        // 서비스에서 이미 M/F로 변환해서 넘어왔으므로 바로 비교
        return gender != null && !gender.isEmpty() ? userEntity.gender.eq(gender) : null;
    }

    private BooleanExpression ageEq(Integer age) {
        if (age == null || age <= 0) return null;
        
        int current_year = LocalDate.now().getYear();
        // 한국식 나이 계산: (현재연도 - 출생연도) + 1
        NumberExpression<Integer> ageExpression = 
            Expressions.asNumber(current_year).subtract(userEntity.birthDate.year()).add(1);
        
        return ageExpression.eq(age);
    }
}