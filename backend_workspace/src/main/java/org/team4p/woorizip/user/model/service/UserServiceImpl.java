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
@Transactional(readOnly = true) // 읽기 전용 기본 설정
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public int selectCheckEmailId(String emailId) { // 메서드명 인터페이스와 일치 확인
        return userRepository.findByEmailId(emailId) != null ? 1 : 0;
    }

    @Override
    public UserDto selectUser(String emailId) { // 매개변수명을 emailId로 통일
        UserEntity entity = userRepository.findByEmailId(emailId);
        return entity != null ? UserDto.fromEntity(entity) : null;
    }

    @Override
    @Transactional // 쓰기 작업
    public int insertUser(UserDto userDto) {
        try {
            // 비밀번호 암호화
            userDto.setPassword(passwordEncoder.encode(userDto.getPassword()));
            UserEntity entity = userDto.toEntity();
            return userRepository.save(entity) != null ? 1 : 0;
        } catch (Exception e) {
            log.error("회원 가입 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    @Override
    @Transactional
    public int updateUser(UserDto userDto) {
        try {
            // save는 PK(userNo)가 있으면 자동으로 update 수행
            return userRepository.save(userDto.toEntity()) != null ? 1 : 0;
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
    public int selectSearchEmailCount(String keyword) {
        return (int) userRepository.countSearchEmailId(keyword);
    }

    @Override
    public int selectSearchAgeCount(int age) {
        return (int) userRepository.countSearchAge(age);
    }

    @Override
    public List<UserDto> selectSearchEmailId(String keyword, Pageable pageable) { // 메서드명 확인
        return toList(userRepository.findBySearchEmailId(keyword, pageable));
    }

    @Override
    public List<UserDto> selectSearchAge(int age, Pageable pageable) {
        return toList(userRepository.findBySearchAge(age, pageable));
    }

    // List 변환 로직
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