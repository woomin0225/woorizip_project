package org.team4p.woorizip.board.ai.model.dto;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record FastApiSummaryResponse(
        String title,
        Integer bullets,
        String summary,
        @JsonProperty("key_points") List<String> keyPoints,
        String conclusion,
        List<String> schedules,
        @JsonProperty("action_items") List<String> actionItems,
        @JsonProperty("attachment_count") Integer attachmentCount,
        List<FastApiAttachmentInfo> attachments,
        List<String> warnings
) {
    public FastApiSummaryResponse {
        keyPoints = keyPoints == null ? new ArrayList<>() : keyPoints;
        schedules = schedules == null ? new ArrayList<>() : schedules;
        actionItems = actionItems == null ? new ArrayList<>() : actionItems;
        attachments = attachments == null ? new ArrayList<>() : attachments;
        warnings = warnings == null ? new ArrayList<>() : warnings;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FastApiAttachmentInfo(
            String filename,
            @JsonProperty("mime_type") String mimeType,
            Integer chars
    ) {
    }
}