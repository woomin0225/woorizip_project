package org.team4p.woorizip.house.image.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.house.image.dto.HouseImageDto;
import org.team4p.woorizip.house.image.jpa.entity.HouseImageEntity;
import org.team4p.woorizip.house.image.jpa.repository.HouseImageRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HouseImageServiceImpl implements HouseImageService {
	private final HouseImageRepository houseImageRepository;
	private final UploadProperties uploadProperties;
	
	@Override
	public List<HouseImageDto> selectHouseImages(String houseNo) {
		// 건물 이미지 목록 조회
		List<HouseImageEntity> rows = houseImageRepository.findAllByHouseNo(houseNo);
		List<HouseImageDto> list = new ArrayList<>();
		rows.forEach(entity->list.add(entity.toDto()));
		return list;
	}

	@Override
	public int insertHouseImage(List<MultipartFile> newImages, String houseNo) {
		// 건물 사진 등록
		// 이미지 등록 : 이미지 파일 저장 실패하면 DB에도 등록 안됨. DB에 저장 실패하면 파일저장소에서 삭제됨
		
		for(MultipartFile newImage : newImages) {
			String originalImageName = newImage.getOriginalFilename();
			// 파일이름변환
			if (originalImageName == null || originalImageName.isBlank()) {
//				throw new IllegalArgumentException("원본 파일명이 없습니다.");
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
			File saveDir = uploadProperties.houseImageDir().toFile();
	        if (!saveDir.exists()) saveDir.mkdirs();
	        File saveFile = new File(saveDir, storedImageName);
	        try {
	            newImage.transferTo(saveFile);
	        } catch (Exception e) {
	            continue;
	        }
	
	        // HouseImageDto만들어서 DB에 저장
	        HouseImageEntity houseImageEntity = HouseImageEntity.builder()
										            		.houseNo(houseNo)
										            		.houseOriginalImageName(originalImageName)
										            		.houseStoredImageName(storedImageName)
										            		.build();
			
			try {
				houseImageRepository.save(houseImageEntity);
		    } catch(Exception e) {
		    		// DB에 사진이름 저장 실패하면 저장소에서 파일 삭제
		    		try {
					Files.deleteIfExists(saveFile.toPath());
				} catch (IOException e2) {continue;}
		    		continue;
		    }
		}
		int imageCount = houseImageRepository.countByHouseNo(houseNo);
		return imageCount;
	}

	@Override
	public int deleteHouseImageByHouseImageNo(List<Integer> deleteImageNos, String currentHouseNo) {
		// 건물 사진 삭제
		// 건물사진번호로 삭제하고 현재 사진 갯수 반환
		for(int deleteImageNo : deleteImageNos) {
			// 삭제할 사진이 db에 있는지 검사
			Optional<HouseImageEntity> row= houseImageRepository.findById(deleteImageNo);
			if(!row.isPresent()) continue;
			HouseImageEntity entity = row.get();
			// 삭제할 사진이 해당 건물의 소유가 맞는지 검사
			if(!entity.getHouseNo().equals(currentHouseNo)) continue;
			
			// DB에서 삭제
			houseImageRepository.deleteById(deleteImageNo);
			
			// entity로부터 사진 경로 구성
			File targetFile = new File(uploadProperties.houseImageDir().toFile(), entity.getHouseStoredImageName());
			// 파일저장소에서 삭제
			try {
				Files.deleteIfExists(targetFile.toPath());
			} catch (IOException e) {continue;}
		}
		
		int imageCount = houseImageRepository.countByHouseNo(currentHouseNo);
		
		return imageCount; 
	}

	@Override
	@Transactional
	public void deleteHouseImagesAll(String houseNo) {
		// 건물 이미지 전부 삭제
		List<HouseImageEntity> rows = houseImageRepository.findAllByHouseNo(houseNo);
		for(HouseImageEntity entity:rows) {
			houseImageRepository.deleteById(entity.getHouseImageNo());
		}
	}

	@Override
	public int countHouseImageNumber(String houseNo) {
		// 건물 이미지 갯수 반환
		return houseImageRepository.countByHouseNo(houseNo);
	}
}
