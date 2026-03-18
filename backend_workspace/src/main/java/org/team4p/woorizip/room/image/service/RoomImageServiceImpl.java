package org.team4p.woorizip.room.image.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.room.image.analyze.service.RoomImageAnalysisService;
import org.team4p.woorizip.room.image.dto.RoomImageDto;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageEntity;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageSummaryEntity;
import org.team4p.woorizip.room.image.jpa.repository.RoomImageRepository;
import org.team4p.woorizip.room.image.jpa.repository.RoomImageSummaryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomImageServiceImpl implements RoomImageService {
	private final RoomImageRepository roomImageRepository;
	private final UploadProperties uploadProperties;
	private final RoomImageAnalysisService roomImageAnalysisService;
	private final RoomImageSummaryRepository roomImageSummaryRepository;
	
	@Override
	public List<RoomImageDto> selectRoomImages(String roomNo) {
		// 방에 해당하는 사진 리스트 조회
		List<RoomImageEntity> rows = roomImageRepository.findAllByRoomNoOrderByRoomImageNo(roomNo);
		
		return rows.stream().map(entity->entity.toDto()).collect(Collectors.toList());
	}

	@Override
	@Transactional
	public int insertRoomImage(List<MultipartFile> newImages, String roomNo) {
		// 방 사진 등록
		
		for(MultipartFile newImage : newImages) {
			String originalImageName = newImage.getOriginalFilename();
			// 파일이름변환
			if (originalImageName == null || originalImageName.isBlank()) {
//	            throw new IllegalArgumentException("원본 파일명이 없습니다.");
				continue;	//남은 파일 목록들을 계속 저장 시도하기 위해 에러발생없이 진행
	        }
			
			int index = originalImageName.lastIndexOf(".");
			if (index < 0) {
//				throw new IllegalArgumentException("확장자가 없는 파일입니다: " + originalImageName);
				continue;
			}
			String extension = originalImageName.substring(index);
			
			String storedImageName = UUID.randomUUID().toString() + extension;
			
			// 파일저장소에 저장
			File saveDir = uploadProperties.roomImageDir().toFile();
            if (!saveDir.exists()) saveDir.mkdirs();
            File saveFile = new File(saveDir, storedImageName);
            try {
                newImage.transferTo(saveFile);
            } catch (Exception e) {
                continue;
            }
            
            // RoomImageDto만들어서 DB에 저장
            RoomImageEntity roomImageEntity = RoomImageEntity.builder()
										            		.roomNo(roomNo)
										            		.roomOriginalImageName(originalImageName)
										            		.roomStoredImageName(storedImageName)
										            		.build();
            RoomImageEntity savedEntity;
            	try {
					savedEntity = roomImageRepository.save(roomImageEntity);
				} catch (Exception e) {
					try {
						Files.deleteIfExists(saveFile.toPath());
					} catch (IOException e2) { continue; }
						continue;
					}
            	
            	// 이미지 AI 분석결과 생성 및 저장
            	try {
					roomImageAnalysisService.analyzeAndSave(savedEntity);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		roomImageSummaryRepository.save(
				RoomImageSummaryEntity.builder()
										.roomNo(roomNo)
										.summaryStatus("PENDING")
										.imageCount(0)
										.retryCount(0)
										.build()
				);
		
		int imageCount = roomImageRepository.countByRoomNo(roomNo);
		return imageCount;
	}

	@Override
	@Transactional
	public int deleteRoomImageByRoomImageNo(List<Integer> deleteImageNos, String currentRoomNo) {
		// 방 이미지 삭제
		// 방사진번호로 삭제하고 현재 사진 갯수 반환
		for(int deleteImageNo : deleteImageNos) {
			// 삭제할 사진이 db에 있는지 검사
			Optional<RoomImageEntity> row= roomImageRepository.findById(deleteImageNo);
			if(!row.isPresent()) continue;
			RoomImageEntity entity = row.get();
			// 삭제할 사진이 해당 건물의 소유가 맞는지 검사
			if(!entity.getRoomNo().equals(currentRoomNo)) continue;
			
			// DB에서 삭제
			roomImageRepository.deleteById(deleteImageNo);
			
			// ai 이미지분석 db에서 삭제
			roomImageAnalysisService.deleteAnalyzedOne(deleteImageNo);
			
			// entity로부터 사진 경로 구성
			File targetFile = new File(uploadProperties.roomImageDir().toFile(), entity.getRoomStoredImageName());
			// 파일저장소에서 삭제
			try {
				Files.deleteIfExists(targetFile.toPath());
			} catch (IOException e) {continue;}
		}
		roomImageSummaryRepository.save(
				RoomImageSummaryEntity.builder()
										.roomNo(currentRoomNo)
										.summaryStatus("PENDING")
										.imageCount(0)
										.retryCount(0)
										.build()
				);
		
		int imageCount = roomImageRepository.countByRoomNo(currentRoomNo);
		
		return imageCount; 
	}

	@Override
	@Transactional
	public void deleteRoomImagesAll(String roomNo) {
		// 방 이미지 전부 삭제
		List<RoomImageEntity> rows = roomImageRepository.findAllByRoomNoOrderByRoomImageNo(roomNo);
		for(RoomImageEntity entity:rows) {
			int deleteImageNo = entity.getRoomImageNo();
			roomImageRepository.deleteById(deleteImageNo);
			
			// ai 이미지분석 db에서 삭제
			roomImageAnalysisService.deleteAnalyzedOne(deleteImageNo);
		}
	}

	@Override
	public int countRoomImageNumber(String roomNo) {
		// 방 이미지 갯수 반환
		return roomImageRepository.countByRoomNo(roomNo);
	}
	
}
