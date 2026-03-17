package org.team4p.woorizip.ai.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.ai.dto.SttTranscribeRequest;
import org.team4p.woorizip.ai.dto.SttTranscribeResponse;
import org.team4p.woorizip.ai.dto.TtsSynthesizeRequest;
import org.team4p.woorizip.ai.dto.TtsSynthesizeResult;
import org.team4p.woorizip.ai.service.AzureTtsService;
import org.team4p.woorizip.ai.service.SpeechToTextService;
import org.team4p.woorizip.common.api.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/voice")
public class VoiceController {

    private final AzureTtsService azureTtsService;
    private final SpeechToTextService speechToTextService;

    @PostMapping("/tts")
    public ResponseEntity<byte[]> tts(@Valid @RequestBody TtsSynthesizeRequest request) {
        TtsSynthesizeResult result = azureTtsService.synthesize(request);
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf(result.mimeType()))
                .body(result.audioBytes());
    }

    @PostMapping(value = "/stt", produces = MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8")
    public ResponseEntity<ApiResponse<SttTranscribeResponse>> stt(@Valid @RequestBody SttTranscribeRequest request) {
        SttTranscribeResponse response = speechToTextService.transcribe(request);
        return ResponseEntity.ok(ApiResponse.ok("STT transcribed", response));
    }
}
