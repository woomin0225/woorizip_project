package org.team4p.woorizip.user.model.service;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.user.model.dto.UserDto;

public interface UserService {
    
    // 아이디 중복 체크
    int selectCheckEmailId(String emailId);

    // 회원 정보 조회
    UserDto selectUser(String emailId);

    // 회원 가입
    int insertUser(UserDto userDto);

    // 회원 정보 수정
    int updateUser(UserDto userDto);

    // 회원 수 조회
    int selectListCount();

    // 회원 목록 조회
    List<UserDto> selectList(Pageable pageable);

    // 아이디 검색 목록 갯수 조회
    int selectSearchEmailCount(String keyword);

    // 나이 검색 목록 갯수 조회
    int selectSearchAgeCount(int age);

    // 아이디 검색 목록 조회
    List<UserDto> selectSearchEmailId(String keyword, Pageable pageable);

    // 나이 검색 목록 조회
    List<UserDto> selectSearchAge(int age, Pageable pageable);
}