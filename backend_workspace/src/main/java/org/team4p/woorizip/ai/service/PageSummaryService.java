package org.team4p.woorizip.ai.service;

import org.team4p.woorizip.ai.dto.PageSummaryRequest;
import org.team4p.woorizip.ai.dto.PageSummaryResponse;

public interface PageSummaryService {
    PageSummaryResponse summarize(PageSummaryRequest request);
}
