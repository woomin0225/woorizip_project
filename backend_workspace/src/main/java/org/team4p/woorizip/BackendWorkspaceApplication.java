package org.team4p.woorizip;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class BackendWorkspaceApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendWorkspaceApplication.class, args);
	}

}
