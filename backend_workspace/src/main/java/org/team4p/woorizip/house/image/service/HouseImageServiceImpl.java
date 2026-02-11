package org.team4p.woorizip.house.image.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.team4p.woorizip.house.image.dto.HouseImageDto;
import org.team4p.woorizip.house.image.jpa.repository.HouseImageRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HouseImageServiceImpl implements HouseImageService {
	private final HouseImageRepository houseImageRepository;
	
	@Override
	public List<HouseImageDto> selectHouseImages(String houseNo) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public HouseImageDto insertHouseImage(HouseImageDto houseImageDto) {
		// 건물 사진 등록
		return houseImageRepository.save(houseImageDto.toEntity()).toDto();
		
	}

	@Override
	public int deleteHouseImageByHouseImageNo(int deleteImageNo) {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public int deleteHouseImagesAll(String houseNo) {
		// TODO Auto-generated method stub
		return 0;
	}
	

}
