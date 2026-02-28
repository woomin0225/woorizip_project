package org.team4p.woorizip.auth.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.team4p.woorizip.common.config.UploadProperties;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

	private final UploadProperties uploadProperties;
	
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        registry.addResourceHandler("/upload/**")
                .addResourceLocations(
                		"file:///Users/joosung/upload_files/",
                		"file:/"+uploadProperties.uploadDir()
                	)
                .setCachePeriod(3600);
    }
}