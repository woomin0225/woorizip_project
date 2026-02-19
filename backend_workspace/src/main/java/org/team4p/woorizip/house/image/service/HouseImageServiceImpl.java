package org.team4p.woorizip.house.image.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.house.image.dto.HouseImageDto;
import org.team4p.woorizip.house.image.jpa.entity.HouseImageEntity;
import org.team4p.woorizip.house.image.jpa.repository.HouseImageRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HouseImageServiceImpl implements HouseImageService {
	private final HouseImageRepository houseImageRepository;
	
	@Override
	public List<HouseImageDto> selectHouseImages(String houseNo) {
		// 건물 이미지 목록 조회
		List<HouseImageEntity> rows = houseImageRepository.findAllByHouseNo(houseNo);
		List<HouseImageDto> list = new ArrayList<>();
		rows.forEach(entity->list.add(entity.toDto()));
		return list;
	}

	@Override
	@Transactional
	public HouseImageDto insertHouseImage(HouseImageDto houseImageDto) {
		// 건물 사진 등록
		return houseImageRepository.save(houseImageDto.toEntity()).toDto();
		
	}

	@Override
	@Transactional
	public HouseImageDto deleteHouseImageByHouseImageNo(int deleteImageNo, String currentHouseNo) {
		// 건물 사진 삭제
		// 건물사진번호로 건물사진 엔티티 반환
		Optional<HouseImageEntity> OptionalEntity = houseImageRepository.findById(deleteImageNo);
		if(!OptionalEntity.isPresent()) throw new NotFoundException("해당 번호의 사진을 찾을 수 없습니다.");
		if(!OptionalEntity.get().getHouseNo().equals(currentHouseNo)) throw new IllegalArgumentException("해당 건물의 사진이 아닙니다.");
		
		houseImageRepository.deleteById(deleteImageNo);
		
		return OptionalEntity.get().toDto();
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
}
