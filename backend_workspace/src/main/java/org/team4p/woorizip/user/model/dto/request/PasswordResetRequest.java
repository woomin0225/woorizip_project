package org.team4p.woorizip.user.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordResetRequest {

    @NotBlank(message = "이름은 필수입니다.")
    private String name;

    @NotBlank(message = "아이디는 필수입니다.")
    private String emailId;

    @NotBlank(message = "휴대폰 번호는 필수입니다.")
    private String phone;

    @NotBlank(message = "검증 토큰은 필수입니다.")
    private String verificationToken;

    @NotBlank(message = "새 비밀번호는 필수입니다.")
    @Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,16}$",
        message = "비밀번호는 8~16자 영문, 숫자, 특수문자를 포함해야 합니다."
    )
    private String newPassword;
}
