package org.team4p.woorizip.user.jpa.repository;

import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.user.model.dto.UserDto;
import java.util.List;

public interface UserRepositoryCustom {
    UserEntity findByEmailId(String email_id);
    
    UserEntity findByNameAndPhone(String name, String phone);

    UserEntity findByNameAndEmailIdAndPhone(String name, String emailId, String phone);

    long countSearchList(UserDto userdto);

    List<UserEntity> findBySearchList(UserDto userdto, Pageable pageable);
}
