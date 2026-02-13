package org.team4p.woorizip.user.model.service;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.jpa.repository.UserRepository;
import org.team4p.woorizip.user.model.dto.UserDto;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public int selectCheckEmailId(String emailId) {
        return userRepository.findByEmailId(emailId) != null ? 1 : 0;
    }

    @Override
    public UserDto selectUser(UserDto userDto) {
        UserEntity user_entity = userRepository.findByEmailId(userDto.getEmailId());
        return user_entity != null ? UserDto.fromEntity(user_entity) : null;
    }

    @Override
    @Transactional
    public int insertUser(UserDto userDto) {
        try {
            userDto.setPassword(passwordEncoder.encode(userDto.getPassword()));
            return userRepository.save(userDto.toEntity()) != null ? 1 : 0;
        } catch (Exception e) {
            log.error("회원 가입 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * [수정됨] 회원 정보 수정 (Update)
     * - 기존: DTO -> Entity 변환 후 save (덮어쓰기 위험)
     * - 변경: 조회 -> 필드 값 변경(Dirty Checking) -> 저장
     */
    @Override
    @Transactional
    public int updateUser(UserDto userDto) {
        try {
            UserEntity userEntity = userRepository.findByEmailId(userDto.getEmailId());
            
            if (userEntity == null) {
                log.warn("수정할 회원을 찾을 수 없음: {}", userDto.getEmailId());
                return 0;
            }

            if (userDto.getName() != null && !userDto.getName().isEmpty()) {
                userEntity.setName(userDto.getName());
            }
            if (userDto.getPhone() != null && !userDto.getPhone().isEmpty()) {
                userEntity.setPhone(userDto.getPhone());
            }
            if (userDto.getBirthDate() != null) {
                userEntity.setBirthDate(userDto.getBirthDate());
            }
            
            if (userDto.getGender() != null && !userDto.getGender().isEmpty()) {
                String convertedGender = convert_gender(userDto.getGender());
                userEntity.setGender(convertedGender);
            }

            if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
                userEntity.setPassword(passwordEncoder.encode(userDto.getPassword()));
            }

            return userRepository.save(userEntity) != null ? 1 : 0;

        } catch (Exception e) {
            log.error("회원 수정 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    @Override
    public int selectListCount() {
        return (int) userRepository.count();
    }

    @Override
    public List<UserDto> selectList(Pageable pageable) {
        return toList(userRepository.findAll(pageable).getContent());
    }

    @Override
    public int selectSearchListCount(UserDto userDto) {
        userDto.setGender(convert_gender(userDto.getGender()));
        return (int) userRepository.countSearchList(userDto);
    }

    @Override
    public List<UserDto> selectSearchList(UserDto userDto, Pageable pageable) {
        userDto.setGender(convert_gender(userDto.getGender()));
        return toList(userRepository.findBySearchList(userDto, pageable));
    }

    private String convert_gender(String gender_code) {
        if (gender_code == null) return null;
        if (gender_code.equals("1") || gender_code.equals("3")) return "M";
        if (gender_code.equals("2") || gender_code.equals("4")) return "F";
        return gender_code; // 이미 M이나 F면 그대로 반환
    }

    private List<UserDto> toList(List<UserEntity> list) {
        List<UserDto> dtos = new ArrayList<>();
        if (list != null) {
            for (UserEntity entity : list) {
                dtos.add(UserDto.fromEntity(entity));
            }
        }
        return dtos;
    }
}