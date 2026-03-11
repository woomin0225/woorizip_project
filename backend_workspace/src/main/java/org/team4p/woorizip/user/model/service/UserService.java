package org.team4p.woorizip.user.model.service;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.user.model.dto.UserDto;

public interface UserService {
    
    // 아이디 중복 체크
    int selectCheckEmailId(String emailId);
    
    // 아이디 찾기
    String selectFindId(UserDto userDto);
    
    // 비밀번호 재설정(휴대폰 인증)
    void sendPasswordResetCode(String name, String phone);
    String verifyPasswordResetCode(String name, String phone, String code);
    void resetPasswordByPhoneVerification(String name, String phone, String verificationToken, String newPassword);

    // 회원 정보 조회
    UserDto selectUser(UserDto userDto);
    UserDto selectUserByUserNo(String userNo);

    // 회원 가입
    int insertUser(UserDto userDto);

    // 회원 정보 수정
    int updateUser(UserDto userDto);

    // 회원 탈퇴 (soft delete)
    int withdrawUser(String emailId);

    // 회원 수 조회
    int selectListCount();

    // 회원 목록 조회
    List<UserDto> selectList(Pageable pageable);

    // 유저 검색 목록 갯수 조회
    int selectSearchListCount(UserDto userDto);

    // 유저 검색 목록 조회
    List<UserDto> selectSearchList(UserDto userDto, Pageable pageable);


}
