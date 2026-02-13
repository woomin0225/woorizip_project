package org.team4p.woorizip.facility.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacilityCategoryDTO {
    private Integer facilityCode;
    private String facilityType;
    private Map<String, Boolean> facilityOptions;
}