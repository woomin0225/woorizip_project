package org.team4p.woorizip.ai.service;

import org.team4p.woorizip.ai.dto.TtsSynthesizeRequest;

public interface AzureTtsService {
    byte[] synthesize(TtsSynthesizeRequest request);
}

