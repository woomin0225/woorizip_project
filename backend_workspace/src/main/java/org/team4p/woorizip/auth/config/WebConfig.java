package org.team4p.woorizip.auth.config;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

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

    private String[] contractDocResourceLocations() {
        List<String> locations = new ArrayList<>();

        if (uploadProperties.contractDocDir() != null && !uploadProperties.contractDocDir().isBlank()) {
            locations.add(toResourceLocation(uploadProperties.contractDocDirPath()));
        }

        if (uploadProperties.uploadDir() != null && !uploadProperties.uploadDir().isBlank()) {
            locations.add(toResourceLocation(Path.of(uploadProperties.uploadDir(), "contract_docs")));
        }

        return locations.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toArray(String[]::new);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/upload/**")
                .addResourceLocations(toResourceLocation(Path.of(uploadProperties.uploadDir())))
                .setCachePeriod(3600);

        registry.addResourceHandler("/contract-docs/**")
                .addResourceLocations(contractDocResourceLocations())
                .setCachePeriod(3600);
    }
}
