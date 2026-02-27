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
	public RestTemplate houseRestTemplate(RestTemplateBuilder builder, @Value("${kakaomap.rest-api-key}") String kakaomapRestApiKey) {
		// https://developers.kakao.com/docs/latest/ko/local/dev-guide
		// https://developers.kakao.com/tool/rest-api/open/get/v2-local-search-address.%7Bformat%7D
		return builder
				.rootUri("https://dapi.kakao.com")
				.defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK "+kakaomapRestApiKey)
				.connectTimeout(Duration.ofSeconds(10))
				.readTimeout(Duration.ofSeconds(10))
				.build();
//		return builder
//			      .rootUri("https://dapi.kakao.com")
//			      .defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK " + kakaomapRestApiKey)
//			      .additionalInterceptors((request, body, execution) -> {
//			        System.out.println("KAKAO ACTUAL URI = " + request.getURI());
//			        return execution.execute(request, body);
//			      })
//			      .connectTimeout(Duration.ofSeconds(10))
//			      .readTimeout(Duration.ofSeconds(10))
//			      .build();
	}
}
