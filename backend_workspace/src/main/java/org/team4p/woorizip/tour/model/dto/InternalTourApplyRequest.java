package org.team4p.woorizip.tour.model.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InternalTourApplyRequest {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate visitDate;

    @JsonFormat(pattern = "HH:mm:ss")
    private String visitTime;

    @NotBlank(message = "메시지는 필수 입력 항목입니다.")
    private String message;

    private String userName;

    private String userPhone;
}
