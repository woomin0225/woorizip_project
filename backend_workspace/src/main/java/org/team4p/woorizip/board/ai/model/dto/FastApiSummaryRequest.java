package org.team4p.woorizip.board.ai.model.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

public record FastApiSummaryRequest(
        @JsonProperty("target_type") String targetType,
        String title,
        String text,
        List<SummaryAttachment> attachments,
        Integer bullets
) {
    public FastApiSummaryRequest {
        attachments = attachments == null ? new ArrayList<>() : attachments;
        bullets = bullets == null ? 5 : bullets;
    }

    public record SummaryAttachment(
            String filename,
            @JsonProperty("mime_type") String mimeType,
            String text,
            @JsonProperty("file_base64") String fileBase64,
            Map<String, Object> meta
    ) {
        public SummaryAttachment {
            meta = meta == null ? new HashMap<>() : meta;
        }
    }
}
