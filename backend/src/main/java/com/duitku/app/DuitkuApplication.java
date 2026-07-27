package com.duitku.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DuitkuApplication {
    public static void main(String[] args) {
        SpringApplication.run(DuitkuApplication.class, args);
    }
}
