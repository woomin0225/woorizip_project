package org.team4p.woorizip.user.model.dto;

import java.util.Date;

import org.team4p.woorizip.user.jpa.entity.UserEntity;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * UserDto
 * - UserEntity(tb_users)와 필드 및 데이터 타입 동기화
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {

    private String userNo; // String (UUID)
    
    @NotBlank(message = "이메일 아이디는 필수입력입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String emailId;

    @NotBlank(message = "비밀번호는 필수입력입니다.")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,16}$", 
             message = "비밀번호는 8~16자 영문, 숫자, 특수문자를 포함해야 합니다.")
    private String password;

    @NotBlank(message = "이름은 필수입력입니다.")
    private String name;

    @NotBlank(message = "전화번호는 필수입력입니다.")
    private String phone;

    @NotBlank(message = "성별은 필수입력입니다.")
    private String gender; // Entity prePersist에서 M/F 변환 처리됨

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date birthDate; // Entity 타입에 맞춰 Date로 변경
    
    private Integer age;

    private String socialId;
    private String provider;

    private String type;    // 임대인/임차인 ('USER', 'LESSOR')
    private String role;    // 일반 사용자/관리자('USER', 'ADMIN')

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date updatedAt;

    private String deletedYn;

    /**
     * DTO -> Entity 변환
     */
    public UserEntity toEntity() {
        return UserEntity.builder()
                .userNo(userNo)
                .emailId(emailId)
                .password(password)
                .name(name)
                .phone(phone)
                .gender(gender)
                .birthDate(birthDate)
                .socialId(socialId)
                .provider(provider)
                .type(type)
                .role(role)
                .build();
    }

    /**
     * Entity -> DTO 변환
     */
    public static UserDto fromEntity(UserEntity entity) {
        if (entity == null) return null;

        return UserDto.builder()
                .userNo(entity.getUserNo())
                .emailId(entity.getEmailId())
                // .password(entity.getPassword()) // 조회 시 비밀번호는 제외
                .name(entity.getName())
                .phone(entity.getPhone())
                .gender(entity.getGender())
                .birthDate(entity.getBirthDate())
                .socialId(entity.getSocialId())
                .provider(entity.getProvider())
                .type(entity.getType())
                .role(entity.getRole())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .deletedYn(entity.getDeletedYn())
                .build();
    }
}