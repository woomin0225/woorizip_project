package org.team4p.woorizip.house.image.service;

import java.util.List;

import org.team4p.woorizip.house.image.dto.HouseImageDto;

public interface HouseImageService {
	List<HouseImageDto> selectHouseImages(String houseNo);
	HouseImageDto insertHouseImage(HouseImageDto houseImageDto);
	int deleteHouseImageByHouseImageNo(int deleteImageNo);
	int deleteHouseImagesAll(String houseNo);
}
