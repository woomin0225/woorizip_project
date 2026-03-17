package org.team4p.woorizip.room.image.dto.ai;

import jakarta.persistence.Column;
import lombok.Data;

@Data
public class SimpleImageCaption {
	@Column(name="caption")
	private String caption;
}
