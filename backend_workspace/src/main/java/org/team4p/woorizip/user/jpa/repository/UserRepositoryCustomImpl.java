package org.team4p.woorizip.user.jpa.repository;

//import static 을 사용하면 별도로 필드 선언하지 않아도 됨
import static org.team4p.woorizip.user.jpa.entity.QUserEntity.userEntity;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.user.jpa.entity.UserEntity;

import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.core.types.dsl.Wildcard;
import com.querydsl.jpa.impl.JPAQueryFactory;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;


@Repository
@RequiredArgsConstructor  //final 필드에 대해 생성자 주입 자동 생성용 어노테이션 (Lombok)
public class UserRepositoryCustomImpl implements UserRepositoryCustom {

    private final JPAQueryFactory queryFactory;  //QueryDSL 의 핵심 객체임
    private final EntityManager entityManager;  //queryDSL 에서 JPQL/Native Query 사용을 위해 의존성 추가함

    //queryDSL 은 Q엔티티클래스 사용함 => import static 을 사용하면 별도로 선언하지 않아도 됨
    //private QUserEntity qUserEntity = QUserEntity.userEntity;
    
 // src/main/generated 폴더가 없으면, 위 구문을 주석 처리한 다음
 // Gradle Tasks 뷰 > build > clean 더블 클릭(실행)
 // 다시 Gradle Tasks 뷰 > build > classes 더블 클릭(실행)
 // src/main/generated 폴더 생겼는지 확인한 다음 주석 풀기함

    /**
     * 사용자 아이디로 회원 정보 조회
     */
    @Override
    public UserEntity findByEmailId(String email_id) {
        //queryDsl 사용
        return queryFactory
                .selectFrom(userEntity)  // SELECT * FROM userEntity
                .where(userEntity.emailId.eq(email_id))  // WHERE userid = :userid
                .fetchOne();  //단건 조회
    }

   
    /**
     * userId 에 특정 키워드가 포함된 회원수 조회
     */
    @Override
    public long countSearchEmailId(String keyword) {
        return queryFactory
                .select(Wildcard.count)  // select count(*) 역할을 하는 QueryDSL 전용 상수
                .from(userEntity)  // from user
                .where(userEntity.emailId.containsIgnoreCase(keyword))  // where userid LIKE %keyword% (대소문자 무시)
                .fetchOne();  // 카운트한 결과 한 개 반환 
    }

   
    @Override
    public long countSearchAge(int age) {
        int currentYear = LocalDate.now().getYear();
        
        // 나이 계산 식: (현재 연도 - 출생 연도) + 1  (한국식 나이 기준)
        // 만약 만 나이 기준이라면 +1을 제거하세요.
        NumberExpression<Integer> ageExpression = 
            Expressions.asNumber(currentYear).subtract(userEntity.birthDate.year()).add(1);

        return queryFactory
                .select(Wildcard.count)
                .from(userEntity)
                .where(ageExpression.between(age, age + 9))
                .fetchOne();
    }



    /**
     * email_id 로 회원 정보 검색 (페이징 적용 조회)
     * */
    @Override
    public List<UserEntity> findBySearchEmailId(String keyword, Pageable pageable) {
        return queryFactory
                .selectFrom(userEntity)  //select * from user
                .where(userEntity.emailId.containsIgnoreCase(keyword))  //where userid like %keyword%
                .offset(pageable.getOffset())  // 시작행 지정 (출력할 페이지숫자 - 1)
                .limit(pageable.getPageSize())  // 페이지 크기 (한 페이지에 출력할 목록 갯수)
                .fetch();  //결과 리스트 반환
    }


    /**
     * 연령대별 검색 (페이징 적용 조회)
     * */
    @Override
    public List<UserEntity> findBySearchAge(int age, Pageable pageable) {
        int currentYear = LocalDate.now().getYear();
        
        // 나이 계산 식: (현재 연도 - 출생 연도) + 1
        NumberExpression<Integer> ageExpression = 
            Expressions.asNumber(currentYear).subtract(userEntity.birthDate.year()).add(1);

        return queryFactory
                .selectFrom(userEntity)
                .where(ageExpression.between(age, age + 9))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

}
