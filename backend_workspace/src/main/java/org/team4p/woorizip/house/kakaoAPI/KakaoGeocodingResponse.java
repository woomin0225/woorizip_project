package org.team4p.woorizip.house.kakaoAPI;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class KakaoGeocodingResponse {
	private List<Document> documents;
	
	@Data
	@JsonIgnoreProperties(ignoreUnknown = true)
	public static class Document {
		private String x;
		private String y;
	}
}
