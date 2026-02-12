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

/**
 * TourDto
 * - TourEntity(tb_tours)와 필드 및 데이터 타입 동기화
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourDto {

    private String tour_no; // String (UUID)

    private String user_no;

    private String room_no;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date visit_date;

    @JsonFormat(pattern = "HH:mm:ss")
    private String visit_time; // Time 타입을 String으로 처리하거나 java.sql.Time 사용

    @NotBlank(message = "메시지는 필수 입력 사항입니다.")
    private String message;

    private String tour_status; // 예: 'PENDING', 'CONFIRMED', 'CANCELED'

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date tour_canceled_at;

    private String canceled_reason;

    /**
     * Controller의 tourDto.setRoomNo(room_no) 호출을 위한 메서드
     * DB 관련 필드인 room_no에 값을 세팅합니다.
     */
    public void setRoomNo(Long room_no) {
        this.room_no = String.valueOf(room_no);
    }

    /**
     * DTO -> Entity 변환
     */
    public TourEntity toEntity() {
        return TourEntity.builder()
                .tourNo(this.tour_no)
                .userNo(this.user_no)
                .roomNo(this.room_no)
                .visitDate(this.visit_date)
                .visitTime(this.visit_time)
                .message(this.message)
                .tourStatus(this.tour_status)
                .tourCanceledAt(this.tour_canceled_at)
                .canceledReason(this.canceled_reason)
                .build();
    }

    /**
     * Entity -> DTO 변환
     */
    public static TourDto fromEntity(TourEntity entity) {
        if (entity == null) return null;

        return TourDto.builder()
                .tour_no(entity.getTourNo())
                .user_no(entity.getUserNo())
                .room_no(entity.getRoomNo())
                .visit_date(entity.getVisitDate())
                .visit_time(entity.getVisitTime())
                .message(entity.getMessage())
                .tour_status(entity.getTourStatus())
                .tour_canceled_at(entity.getTourCanceledAt())
                .canceled_reason(entity.getCanceledReason())
                .build();
    }
}