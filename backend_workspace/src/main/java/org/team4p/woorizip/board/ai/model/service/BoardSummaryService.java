package org.team4p.woorizip.board.ai.model.service;

import org.springframework.security.core.Authentication;
import org.team4p.woorizip.board.ai.model.dto.BoardSummaryResponse;

public interface BoardSummaryService {
    BoardSummaryResponse summarizePost(int postNo, Authentication authentication);
}
