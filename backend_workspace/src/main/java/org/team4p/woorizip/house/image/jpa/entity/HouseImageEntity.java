package org.team4p.woorizip.house.image.jpa.entity;

import org.team4p.woorizip.house.image.dto.HouseImageDto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Table(name="tb_houses_images")
@Entity
public class HouseImageEntity {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private int houseImageNo;
	
	@Column(name="house_no")
	private String houseNo;
	
	@Column(name="house_original_image_name")
	private String houseOriginalImageName;
	
	@Column(name="house_stored_image_name")
	private String houseStoredImageName;
	
	public HouseImageDto toDto() {
		return HouseImageDto.builder()
								.houseImageNo(houseImageNo)
								.houseNo(houseNo)
								.houseOriginalImageName(houseOriginalImageName)
								.houseStoredImageName(houseStoredImageName)
								.build();
	}
}
