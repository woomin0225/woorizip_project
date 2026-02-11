package org.team4p.woorizip.user.jpa.repository;

import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * queryDSL 은 sql 구문을 위한 코드 작성용 메소드를 추가하기 위해 인터페이스를 만듦
 * jpa 가 제공하지 않는 기능에 대한 메소드 추가를 위해 작성함
 * */
public interface UserRepositoryCustom {
    UserEntity findByEmailId(String email_id);

    //관리자용 검색 관련
    long countSearchEmailId(String keyword);
    long countSearchAge(int age);

    List<UserEntity> findBySearchEmailId(String keyword, Pageable pageable);
    List<UserEntity> findBySearchAge(int age, Pageable pageable);
}
