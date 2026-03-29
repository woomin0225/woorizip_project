package org.team4p.woorizip.ai.service;

import org.team4p.woorizip.ai.dto.TtsSynthesizeRequest;
import org.team4p.woorizip.ai.dto.TtsSynthesizeResult;

public interface VoiceTtsService {
    TtsSynthesizeResult synthesize(TtsSynthesizeRequest request);
}
