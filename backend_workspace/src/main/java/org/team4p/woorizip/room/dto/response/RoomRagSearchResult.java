package org.team4p.woorizip.room.dto.response;

import java.util.List;

public record RoomRagSearchResult(
		List<RoomSearchResponse> rooms,
		String explanation
) {
}
