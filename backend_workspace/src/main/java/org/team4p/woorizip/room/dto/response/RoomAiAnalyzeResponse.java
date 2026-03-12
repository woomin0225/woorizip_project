package org.team4p.woorizip.room.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomAiAnalyzeResponse {

	private String summary;
	private String caption;
	private List<String> ocrTexts;
	private List<String> detectedObjects;
	private List<OptionCandidate> optionCandidates;
	private List<String> normalizedOptions;
	private List<String> warnings;
	private Map<String, Object> meta;
	
	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class OptionCandidate {
		private String name;
		private double confidence;
		private String source;
	}
}
