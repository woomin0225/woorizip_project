package org.team4p.woorizip.room.image.analyze.service;

import java.util.List;

public interface RoomImageEmbeddingService {
	List<Float> createEmbedding(String text);
}
