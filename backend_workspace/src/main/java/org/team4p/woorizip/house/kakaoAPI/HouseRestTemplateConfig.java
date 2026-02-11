package org.team4p.woorizip.house.kakaoAPI;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestTemplate;

@Configuration
public class HouseRestTemplateConfig {
	@Bean
	public RestTemplate houseRestTemplate(RestTemplateBuilder builder, @Value("${kakao.rest-api-key}") String kakaoRestApiKey) {
		// https://developers.kakao.com/docs/latest/ko/local/dev-guide
		return builder
				.rootUri("https://dapi.kakao.com")
				.defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK "+kakaoRestApiKey)
				.connectTimeout(Duration.ofSeconds(3))
				.readTimeout(Duration.ofSeconds(3))
				.build();
	}
}
