package org.team4p.woorizip.user.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< Updated upstream
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.team4p.woorizip.user.jpa.entity.UserEntity;

public interface UserRepository
        extends JpaRepository<UserEntity, String>, UserRepositoryCustom {
	@Query("select u.userNo from UserEntity u where u.emailId = :emailId")
    String findUserNoByEmailId(@Param("emailId") String emailId);
=======
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface UserRepository
        extends JpaRepository<UserEntity, String>, UserRepositoryCustom {
	String findUserNoByEmailId(String email);

    @Modifying
    @Transactional
    @Query("update UserEntity u set u.deletedYn = 'Y', u.withdrawAt = CURRENT_TIMESTAMP where u.emailId = :emailId and u.deletedYn = 'N'")
    int markWithdrawnByEmailId(@Param("emailId") String emailId);
>>>>>>> Stashed changes
}
