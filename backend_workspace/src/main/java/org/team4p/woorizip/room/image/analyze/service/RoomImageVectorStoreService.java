package org.team4p.woorizip.room.image.analyze.service;

import java.util.List;

import org.team4p.woorizip.room.image.analyze.jpa.entity.RoomImageAnalysisEntity;

public interface RoomImageVectorStoreService {
	void saveEmbedding(RoomImageAnalysisEntity entity, String embeddingText, List<Float> embedding);
}
