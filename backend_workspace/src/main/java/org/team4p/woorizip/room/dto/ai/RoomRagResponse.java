package org.team4p.woorizip.room.dto.ai;

import java.util.List;

import lombok.Data;

@Data
public class RoomRagResponse {
	private Boolean status;
	private String text;
	private List<String> room_list;
	private String message;
}
