package org.team4p.woorizip.house.kakaoAPI;

import java.util.List;

import lombok.Data;

@Data
public class KakaoGeocodingResponse {
	private List<Document> documents;
	
	@Data
	public static class Document {
		private String x;
		private String y;
	}
}
