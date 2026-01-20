package com.Ghallab.dev.Test_Scanner_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TestScannerBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(TestScannerBackendApplication.class, args);
	}

}
