package org.team4p.woorizip.ai.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.ai.dto.PageSummaryRequest;
import org.team4p.woorizip.ai.dto.PageSummaryResponse;
import org.team4p.woorizip.ai.dto.SttTranscribeRequest;
import org.team4p.woorizip.ai.dto.SttTranscribeResponse;
import org.team4p.woorizip.ai.dto.TtsSynthesizeRequest;
import org.team4p.woorizip.ai.dto.TtsSynthesizeResult;
import org.team4p.woorizip.ai.service.PageSummaryService;
import org.team4p.woorizip.ai.service.SpeechToTextService;
import org.team4p.woorizip.ai.service.VoiceTtsService;
import org.team4p.woorizip.common.api.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/voice")
public class VoiceController {

    private final VoiceTtsService voiceTtsService;
    private final SpeechToTextService speechToTextService;
    private final PageSummaryService pageSummaryService;

    @PostMapping("/tts")
    public ResponseEntity<byte[]> tts(@Valid @RequestBody TtsSynthesizeRequest request) {
        TtsSynthesizeResult result = voiceTtsService.synthesize(request);
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf(result.mimeType()))
                .body(result.audioBytes());
    }

    @PostMapping(value = "/page-summary", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
    public ResponseEntity<ApiResponse<PageSummaryResponse>> pageSummary(@Valid @RequestBody PageSummaryRequest request) {
        PageSummaryResponse response = pageSummaryService.summarize(request);
        return ResponseEntity.ok(ApiResponse.ok("Page summarized", response));
    }

    @PostMapping(value = "/stt", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
    public ResponseEntity<ApiResponse<SttTranscribeResponse>> stt(@Valid @RequestBody SttTranscribeRequest request) {
        SttTranscribeResponse response = speechToTextService.transcribe(request);
        return ResponseEntity.ok(ApiResponse.ok("STT transcribed", response));
    }
}
