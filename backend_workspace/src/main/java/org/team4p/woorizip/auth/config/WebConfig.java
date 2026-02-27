package org.team4p.woorizip.auth.config;

import java.nio.file.Path;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.team4p.woorizip.common.config.UploadProperties;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final UploadProperties uploadProperties;

    private String toResourceLocation(Path path) {
        String uri = path.toAbsolutePath().normalize().toUri().toString();
        return uri.endsWith("/") ? uri : uri + "/";
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/upload/**")
                .addResourceLocations(toResourceLocation(Path.of(uploadProperties.uploadDir())))
                .setCachePeriod(3600);

        registry.addResourceHandler("/contract-docs/**")
                .addResourceLocations(toResourceLocation(uploadProperties.contractDocDirPath()))
                .setCachePeriod(3600);
    }
}
