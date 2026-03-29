package org.team4p.woorizip.ai.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.team4p.woorizip.ai.dto.PageSummaryRequest;
import org.team4p.woorizip.ai.dto.PageSummaryResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PageSummaryServiceImpl implements PageSummaryService {

    private final AiServerClient aiServerClient;

    @Override
    public PageSummaryResponse summarize(PageSummaryRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("target_type", "generic");
        payload.put("title", request.title());
        payload.put("text", request.text());
        payload.put("bullets", request.bullets());

        Map<String, Object> raw = aiServerClient.post("/ai/summary", payload);
        return new PageSummaryResponse(
                asString(raw.get("summary")),
                asStringList(raw.get("key_points")),
                asString(raw.get("conclusion")),
                asStringList(raw.get("schedules")),
                asStringList(raw.get("action_items")),
                asStringList(raw.get("warnings"))
        );
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private List<String> asStringList(Object value) {
        if (!(value instanceof List<?> list)) {
            return new ArrayList<>();
        }

        List<String> results = new ArrayList<>();
        for (Object item : list) {
            String text = asString(item);
            if (StringUtils.hasText(text)) {
                results.add(text);
            }
        }
        return results;
    }
}
