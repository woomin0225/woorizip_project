package org.team4p.woorizip.ai.service;

import org.team4p.woorizip.ai.dto.SttTranscribeRequest;
import org.team4p.woorizip.ai.dto.SttTranscribeResponse;

public interface SpeechToTextService {
    SttTranscribeResponse transcribe(SttTranscribeRequest request);
}
