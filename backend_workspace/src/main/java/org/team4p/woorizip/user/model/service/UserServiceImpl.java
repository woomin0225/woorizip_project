package org.team4p.woorizip.user.model.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
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

    private static final long CODE_EXPIRE_MILLIS = 5 * 60 * 1000L;
    private static final long TOKEN_EXPIRE_MILLIS = 10 * 60 * 1000L;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    // key: name|emailId|phone
    private final Map<String, PhoneVerificationCode> codeStore = new ConcurrentHashMap<>();
    // 인증 완료 후 비밀번호 재설정 허용 토큰 저장소
    private final Map<String, PasswordResetToken> tokenStore = new ConcurrentHashMap<>();

    @Override
    public int selectCheckEmailId(String emailId) {
        return userRepository.findByEmailId(emailId) != null ? 1 : 0;
    }
    
    @Override
    public String selectFindId(UserDto userDto) {
        String name = userDto.getName() != null ? userDto.getName().trim() : null;
        String rawPhone = userDto.getPhone() != null ? userDto.getPhone().trim() : null;
        String normalizedPhone = rawPhone != null ? rawPhone.replaceAll("\\D", "") : null;

        UserEntity user = userRepository.findByNameAndPhone(name, rawPhone);
        if (user == null && normalizedPhone != null && !normalizedPhone.equals(rawPhone)) {
            user = userRepository.findByNameAndPhone(name, normalizedPhone);
        }

        return (user != null) ? user.getEmailId() : null;
    }

    @Override
    @Transactional
    public void sendPasswordResetCode(String name, String emailId, String phone) {
        String normalizedName = normalizeName(name);
        String normalizedEmailId = normalizeEmailId(emailId);
        String normalizedPhone = normalizePhone(phone);

        UserEntity user = findUserForPasswordReset(normalizedName, normalizedEmailId, normalizedPhone);
        if (user == null) {
            throw new IllegalArgumentException("일치하는 회원 정보가 없습니다.");
        }

        String code = String.format("%06d", (int) (Math.random() * 1_000_000));
        String key = buildVerificationKey(normalizedName, normalizedEmailId, normalizedPhone);
        codeStore.put(key, new PhoneVerificationCode(code, System.currentTimeMillis() + CODE_EXPIRE_MILLIS));
        tokenStore.remove(key);

        // TODO: 실제 SMS 발송 연동 지점 (예: Naver SENS, Solapi, Twilio)
        log.info("[PasswordReset] code issued. name={}, emailId={}, phone={}, code={}", normalizedName, normalizedEmailId, normalizedPhone, code);
    }

    @Override
    @Transactional
    public String verifyPasswordResetCode(String name, String emailId, String phone, String code) {
        String normalizedName = normalizeName(name);
        String normalizedEmailId = normalizeEmailId(emailId);
        String normalizedPhone = normalizePhone(phone);
        String normalizedCode = code == null ? "" : code.trim();
        String key = buildVerificationKey(normalizedName, normalizedEmailId, normalizedPhone);

        PhoneVerificationCode issued = codeStore.get(key);
        if (issued == null || issued.expiresAt() < System.currentTimeMillis()) {
            codeStore.remove(key);
            throw new IllegalArgumentException("인증번호가 만료되었습니다. 다시 요청해주세요.");
        }

        if (!issued.code().equals(normalizedCode)) {
            throw new IllegalArgumentException("인증번호가 일치하지 않습니다.");
        }

        UserEntity user = findUserForPasswordReset(normalizedName, normalizedEmailId, normalizedPhone);
        if (user == null) {
            throw new IllegalArgumentException("일치하는 회원 정보가 없습니다.");
        }

        codeStore.remove(key);

        String verificationToken = UUID.randomUUID().toString();
        tokenStore.put(key, new PasswordResetToken(verificationToken, System.currentTimeMillis() + TOKEN_EXPIRE_MILLIS));
        return verificationToken;
    }

    @Override
    @Transactional
    public void resetPasswordByPhoneVerification(String name, String emailId, String phone, String verificationToken, String newPassword) {
        String normalizedName = normalizeName(name);
        String normalizedEmailId = normalizeEmailId(emailId);
        String normalizedPhone = normalizePhone(phone);
        String token = verificationToken == null ? "" : verificationToken.trim();
        String key = buildVerificationKey(normalizedName, normalizedEmailId, normalizedPhone);

        PasswordResetToken issuedToken = tokenStore.get(key);
        if (issuedToken == null || issuedToken.expiresAt() < System.currentTimeMillis()) {
            tokenStore.remove(key);
            throw new IllegalArgumentException("비밀번호 변경 인증이 만료되었습니다. 다시 인증해주세요.");
        }

        if (!issuedToken.token().equals(token)) {
            throw new IllegalArgumentException("유효하지 않은 인증 정보입니다.");
        }

        UserEntity user = findUserForPasswordReset(normalizedName, normalizedEmailId, normalizedPhone);
        if (user == null) {
            throw new IllegalArgumentException("일치하는 회원 정보가 없습니다.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(new java.util.Date());
        userRepository.save(user);

        tokenStore.remove(key);
    }

    @Override
    public UserDto selectUser(UserDto userDto) {
        UserEntity user_entity = userRepository.findByEmailId(userDto.getEmailId());
        return user_entity != null ? UserDto.fromEntity(user_entity) : null;
    }

    @Override
    public UserDto selectUserByUserNo(String userNo) {
        UserEntity userEntity = userRepository.findById(userNo).orElse(null);
        return userEntity != null ? UserDto.fromEntity(userEntity) : null;
    }

    @Override
    @Transactional
    public int insertUser(UserDto userDto) {
        try {
            UserEntity existing = userRepository.findByEmailId(userDto.getEmailId());
            if (existing != null) {
                if ("Y".equalsIgnoreCase(existing.getDeletedYn())) {
                    // 재가입은 신규 생성이 아니라 기존 계정 복구(user_no 유지)
                    existing.setDeletedYn("N");
                    existing.setWithdrawAt(null);
                    existing.setUpdatedAt(new java.util.Date());
                    if (userDto.getName() != null && !userDto.getName().isBlank()) {
                        existing.setName(userDto.getName().trim());
                    }
                    if (userDto.getPhone() != null && !userDto.getPhone().isBlank()) {
                        existing.setPhone(userDto.getPhone().trim());
                    }
                    if (userDto.getGender() != null && !userDto.getGender().isBlank()) {
                        existing.setGender(convert_gender(userDto.getGender()));
                    }
                    if (userDto.getBirthDate() != null) {
                        existing.setBirthDate(userDto.getBirthDate());
                    }
                    if (userDto.getType() != null && !userDto.getType().isBlank()) {
                        existing.setType(userDto.getType().trim().toUpperCase());
                    }
                    if (userDto.getRole() != null && !userDto.getRole().isBlank()) {
                        existing.setRole(userDto.getRole().trim().toUpperCase());
                    }
                    if (userDto.getPassword() != null && !userDto.getPassword().isBlank()) {
                        existing.setPassword(passwordEncoder.encode(userDto.getPassword()));
                    }
                    return userRepository.save(existing) != null ? 1 : 0;
                }
                // 활성 계정 이메일 중복
                return 0;
            }

            userDto.setPassword(passwordEncoder.encode(userDto.getPassword()));
            return userRepository.save(userDto.toEntity()) != null ? 1 : 0;
        } catch (Exception e) {
            log.error("회원 가입 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * 회원 정보 수정 (Update)
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
            userEntity.setUpdatedAt(new java.util.Date());

            return userRepository.save(userEntity) != null ? 1 : 0;

        } catch (Exception e) {
            log.error("회원 수정 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    @Override
    @Transactional
    public int withdrawUser(String emailId) {
        try {
            int updated = userRepository.markWithdrawnByEmailId(emailId);
            if (updated > 0) {
                return updated;
            }

            UserEntity user = userRepository.findByEmailId(emailId);
            if (user != null && "Y".equalsIgnoreCase(user.getDeletedYn())) {
                // 이미 탈퇴된 계정은 멱등하게 성공 처리
                return 1;
            }
            return 0;
        } catch (Exception e) {
            log.error("회원 탈퇴 처리 중 오류 발생: {}", e.getMessage());
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
        return gender_code;
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

    private UserEntity findUserByNameAndPhone(String name, String phone) {
        UserEntity user = userRepository.findByNameAndPhone(name, phone);
        if (user != null) {
            return user;
        }
        // DB 저장 포맷(010-0000-0000) 대응
        String rawPhone = phone != null ? phone.replaceFirst("^(010)(\\d{4})(\\d{4})$", "$1-$2-$3") : null;
        if (rawPhone != null && !rawPhone.equals(phone)) {
            return userRepository.findByNameAndPhone(name, rawPhone);
        }
        return null;
    }

    private String normalizeName(String name) {
        if (name == null) {
            return "";
        }
        return name.trim();
    }

    private String normalizeEmailId(String emailId) {
        if (emailId == null) {
            return "";
        }
        return emailId.trim();
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return "";
        }
        return phone.replaceAll("\\D", "");
    }

    private String buildVerificationKey(String name, String emailId, String phone) {
        return name + "|" + emailId + "|" + phone;
    }

    private UserEntity findUserForPasswordReset(String name, String emailId, String phone) {
        UserEntity user = userRepository.findByNameAndEmailIdAndPhone(name, emailId, phone);
        if (user != null) {
            return user;
        }
        String rawPhone = phone != null ? phone.replaceFirst("^(010)(\\d{4})(\\d{4})$", "$1-$2-$3") : null;
        if (rawPhone != null && !rawPhone.equals(phone)) {
            return userRepository.findByNameAndEmailIdAndPhone(name, emailId, rawPhone);
        }
        return null;
    }

    private record PhoneVerificationCode(String code, long expiresAt) {}
    private record PasswordResetToken(String token, long expiresAt) {}
}
