package org.team4p.woorizip.room.image.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.team4p.woorizip.room.image.analyze.jpa.repository.RoomImageAnalysisRepository;
import org.team4p.woorizip.room.image.dto.ai.RoomImageSummaryRequest;
import org.team4p.woorizip.room.image.dto.ai.RoomImageSummaryResponse;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageSummaryEntity;
import org.team4p.woorizip.room.image.jpa.repository.RoomImageSummaryRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;


@Slf4j
@Service
@RequiredArgsConstructor
public class RoomImageSummaryServiceImpl implements RoomImageSummaryService{

	private final RoomImageSummaryRepository roomImageSummaryRepository;
	private final RoomImageAnalysisRepository roomImageAnalysisRepository;
	private final WebClient.Builder webClientBuilder;
	
	@Value("${ai.server.base-url}")
	private String aiServerUri;
	
	@Override
	public List<RoomImageSummaryEntity> findSummaryPendingRooms() {
		List<RoomImageSummaryEntity> list = roomImageSummaryRepository.findAllBySummaryStatus("PENDING");
		
		return list;
	}

	@Override
	@Transactional
	public String summaryPendingRooms(RoomImageSummaryEntity entity) {
		// state를 PROCESSING으로 전환
		entity.setSummaryStatus("PROCESSING");
		roomImageSummaryRepository.save(entity);
		
		// 요약할 사진분석 목록 조회
		String roomNo = entity.getRoomNo();
		List<String> analyzedList = roomImageAnalysisRepository.findAllImageCaptionsByRoomNo(roomNo);
		RoomImageSummaryRequest request = RoomImageSummaryRequest.builder()
								.roomNo(roomNo)
								.texts(analyzedList)
								.build();
		
		// AI 서버에서 요약 엔드포인트 호출
		WebClient webClient = webClientBuilder.build();
		RoomImageSummaryResponse response = null;
		try {
			Mono<RoomImageSummaryResponse> monoResponse = webClient.post()
					.uri(aiServerUri.concat("/ai/summary/room/images"))
					.bodyValue(request)
					.retrieve()
					.bodyToMono(RoomImageSummaryResponse.class)
					;
			response = monoResponse.block();
			
		} catch (Exception e) {
			// 실패시 state를 retry count +1 처리. 단, retry count 3일 경우 FAILED로 상태 전환
			if(entity.getRetryCount() >= 3) {
				entity.setSummaryStatus("FAILED");
				entity.setLastErrorMessage(e.getMessage());
				
			}else {
				entity.setRetryCount(entity.getRetryCount()+1);
				entity.setSummaryStatus("PENDING");
			}
			roomImageSummaryRepository.save(entity);
			return "요약실패";
		}
		
		if(response.getStatus() != true) {
			// 실패시 state를 retry count +1 처리. 단, retry count 3일 경우 FAILED로 상태 전환
			if(entity.getRetryCount() >= 3) {
				entity.setSummaryStatus("FAILED");
				entity.setLastErrorMessage(response.getStatus() + response.getMessage());
			}else {
				entity.setRetryCount(entity.getRetryCount()+1);
				entity.setSummaryStatus("PENDING");
			}
			roomImageSummaryRepository.save(entity);
			return "요약실패";
		}
			// 요약문구 저장하고, state를 DONE으로 전환, 업데이트 일시를 현재일시로 최신화
			entity.setImageSummary(response.getSummary());
			entity.setSummaryStatus("DONE");
			entity.setImageCount(analyzedList.size());
			entity.setUpdatedAt(LocalDateTime.now());
			roomImageSummaryRepository.save(entity);
//			log.info("방 번호("+response.getRoomNo()+") - 사진분석 요약: "+response.getSummary()+", "+response.getMessage());
			
			return response.getSummary();
	}

	@Override
	public RoomImageSummaryEntity selectSummarizedImageCaption(String roomNo) {
		
		return roomImageSummaryRepository.findById(roomNo).orElse(null);
	}

}