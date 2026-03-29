package org.team4p.woorizip.room.service.event;

public class RoomAiDownstreamRequestedEvent {

	private final String roomNo;

	public RoomAiDownstreamRequestedEvent(String roomNo) {
		this.roomNo = roomNo;
	}

	public String getRoomNo() {
		return roomNo;
	}
}
