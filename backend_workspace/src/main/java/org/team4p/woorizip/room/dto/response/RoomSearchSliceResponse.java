package org.team4p.woorizip.room.dto.response;

import java.util.List;

import org.springframework.data.domain.Slice;

public record RoomSearchSliceResponse(
		List<RoomSearchResponse> content,
		int number,
		int size,
		int numberOfElements,
		boolean first,
		boolean last,
		boolean hasNext,
		long totalElements
) {
	public static RoomSearchSliceResponse from(Slice<RoomSearchResponse> slice, long totalElements) {
		return new RoomSearchSliceResponse(
				slice.getContent(),
				slice.getNumber(),
				slice.getSize(),
				slice.getNumberOfElements(),
				slice.isFirst(),
				slice.isLast(),
				slice.hasNext(),
				totalElements
		);
	}
}
