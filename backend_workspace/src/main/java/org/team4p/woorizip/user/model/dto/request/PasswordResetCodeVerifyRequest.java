package org.team4p.woorizip.user.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordResetCodeVerifyRequest {

    @NotBlank(message = "이름은 필수입니다.")
    private String name;

    @NotBlank(message = "아이디는 필수입니다.")
    private String emailId;

    @NotBlank(message = "휴대폰 번호는 필수입니다.")
    private String phone;

    @NotBlank(message = "인증번호는 필수입니다.")
    private String code;
}
