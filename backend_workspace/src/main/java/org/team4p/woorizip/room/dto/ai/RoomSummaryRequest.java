package org.team4p.woorizip.room.dto.ai;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomSummaryRequest {
	private String roomNo;
	private List<String> tests;
}
