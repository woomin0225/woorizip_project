package org.team4p.woorizip.facility.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FacilityCategoryCreateRequestDTO {

	@NotBlank(message="시설 카테고리 이름 입력이 필요합니다.")
    @Size(max=10, message = "시설 카테고리 이름은 10자 이내여야 합니다.")
    private String facilityType;
	
	@NotNull(message="카테고리 기본 옵션 입력이 필요합니다.")
	@Size(max = 10, message = "카테고리 기본 옵션은 최대 10개까지만 등록 가능합니다.")
    private List<@Size(max = 20, message = "카테고리 기본 옵션 이름은 20자 이내여야 합니다.") String> facilityOptions;
    
}