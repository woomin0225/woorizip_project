package org.team4p.woorizip.ai.dto;

import java.util.ArrayList;
import java.util.List;

public record PageSummaryResponse(
        String summary,
        List<String> keyPoints,
        String conclusion,
        List<String> schedules,
        List<String> actionItems,
        List<String> warnings
) {
    public PageSummaryResponse {
        keyPoints = keyPoints == null ? new ArrayList<>() : keyPoints;
        schedules = schedules == null ? new ArrayList<>() : schedules;
        actionItems = actionItems == null ? new ArrayList<>() : actionItems;
        warnings = warnings == null ? new ArrayList<>() : warnings;
    }
}
