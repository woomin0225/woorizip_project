package org.team4p.woorizip.board.ai.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.board.ai.model.dto.BoardSummaryResponse;
import org.team4p.woorizip.board.ai.model.service.BoardSummaryService;
import org.team4p.woorizip.common.api.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/boards")
public class BoardSummaryController {

    private final BoardSummaryService boardSummaryService;

    @GetMapping("/{postNo}/summary")
    public ResponseEntity<ApiResponse<BoardSummaryResponse>> summarize(
            @PathVariable("postNo") int postNo,
            Authentication authentication
    ) {
        BoardSummaryResponse response = boardSummaryService.summarizePost(postNo, authentication);
        return ResponseEntity.ok(ApiResponse.ok("AI 요약 성공", response));
    }
}
