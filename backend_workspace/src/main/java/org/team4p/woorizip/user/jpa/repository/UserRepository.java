package org.team4p.woorizip.user.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.team4p.woorizip.user.jpa.entity.UserEntity;

public interface UserRepository
        extends JpaRepository<UserEntity, String>, UserRepositoryCustom {
	@Query("select u.userNo from UserEntity u where u.emailId = :emailId")
    String findUserNoByEmailId(@Param("emailId") String emailId);
}
