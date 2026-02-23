package org.team4p.woorizip.house.image.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.house.image.dto.HouseImageDto;

public interface HouseImageService {
	List<HouseImageDto> selectHouseImages(String houseNo);
	int insertHouseImage(List<MultipartFile> newImages, String houseNo);
	int deleteHouseImageByHouseImageNo(List<Integer> deleteImageNo, String currentHouseNo);
	void deleteHouseImagesAll(String houseNo);
	int countHouseImageNumber(String houseNo);
}
