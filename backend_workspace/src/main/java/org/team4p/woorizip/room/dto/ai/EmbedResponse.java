package org.team4p.woorizip.room.dto.ai;

import lombok.Data;

@Data
public class EmbedResponse {
	private Boolean status;
	private String roomNo;
	private String collection;
	private String message;
}
