package org.team4p.woorizip.board.ai.model.dto;

import java.util.ArrayList;
import java.util.List;

public record BoardSummaryResponse(
		Integer postNo,
        String boardTypeNo,
        String title,
        String summary,
        List<String> keyPoints,
        String conclusion,
        List<String> schedules,
        List<String> actionItems,
        Integer attachmentCount,
        List<AttachmentInfo> attachments,
        List<String> warnings
) {
    public BoardSummaryResponse {
        keyPoints = keyPoints == null ? new ArrayList<>() : keyPoints;
        schedules = schedules == null ? new ArrayList<>() : schedules;
        actionItems = actionItems == null ? new ArrayList<>() : actionItems;
        attachments = attachments == null ? new ArrayList<>() : attachments;
        warnings = warnings == null ? new ArrayList<>() : warnings;
    }

    public record AttachmentInfo(
    		Integer fileNo,
            String filename,
            String mimeType,
            Integer chars
    ) {
    }
}