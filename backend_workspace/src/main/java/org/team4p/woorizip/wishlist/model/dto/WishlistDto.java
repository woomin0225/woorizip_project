package org.team4p.woorizip.wishlist.model.dto;

import java.sql.Date;

import org.team4p.woorizip.wishlist.jpa.entity.WishlistEntity;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistDto {

    private String wishNo;

    @NotBlank(message = "사용자 ID(userNo)는 필수입니다.")
    private String userNo;

    @NotBlank(message = "찜 대상 ID(roomNo)는 필수입니다.")
    private String roomNo;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date createdAt;

    // 추가적인 UI 표현용 필드 (예: 매물 제목, 썸네일 등은 Join 후 세팅하거나 별도 처리)
    private String targetTitle; 

    /**
     * DTO -> Entity 변환
     */
    public WishlistEntity toEntity() {
        return WishlistEntity.builder()
                .wishNo(wishNo)
                .userNo(userNo)
                .roomNo(roomNo)
                .createdAt(createdAt)
                .build();
    }

    /**
     * Entity -> DTO 변환
     */
    public static WishlistDto fromEntity(WishlistEntity entity) {
        if (entity == null) return null;

        return WishlistDto.builder()
                .wishNo(entity.getWishNo())
                .userNo(entity.getUserNo())
                .roomNo(entity.getRoomNo())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}