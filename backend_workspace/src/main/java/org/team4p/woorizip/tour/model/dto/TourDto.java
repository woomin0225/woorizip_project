package org.team4p.woorizip.tour.model.dto;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.team4p.woorizip.tour.jpa.entity.TourEntity;

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
public class TourDto {

    private String tourNo;

    private String userNo;

    private String roomNo;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date visitDate;

    @JsonFormat(pattern = "HH:mm:ss")
    private String visitTime;

    @NotBlank(message = "메시지는 필수 입력 사항입니다.")
    private String message;

    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date canceledAt;

    private String canceledReason;

    public void setRoomNo(String roomNo) {
        this.roomNo = String.valueOf(roomNo);
    }

    /**
     * DTO -> Entity 변환
     */
    public TourEntity toEntity() {
        return TourEntity.builder()
                .tourNo(this.tourNo)
                .userNo(this.userNo)
                .roomNo(this.roomNo)
                .visitDate(this.visitDate)
                .visitTime(this.visitTime)
                .message(this.message)
                .status(this.status)
                .canceledAt(this.canceledAt)
                .canceledReason(this.canceledReason)
                .build();
    }

    /**
     * Entity -> DTO 변환
     */
    public static TourDto fromEntity(TourEntity entity) {
        if (entity == null) return null;

        return TourDto.builder()
                .tourNo(entity.getTourNo())
                .userNo(entity.getUserNo())
                .roomNo(entity.getRoomNo())
                .visitDate(entity.getVisitDate())
                .visitTime(entity.getVisitTime())
                .message(entity.getMessage())
                .status(entity.getStatus())
                .canceledAt(entity.getCanceledAt())
                .canceledReason(entity.getCanceledReason())
                .build();
    }
}