package org.team4p.woorizip.room.jpa.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="tb_room_final_summary")
public class RoomFinalSummaryEntity {

	@Id
	@Column(name="room_no")
	private String roomNo;

	@Column(name="final_summary")
	private String finalSummary;

	@Column(name="summary_status")
	private String summaryStatus;

	@Column(name="updated_at")
	private LocalDateTime updatedAt;

	@Column(name="last_error_message")
	private String lastErrorMessage;

	@Column(name="retry_count")
	private Integer retryCount;

}
