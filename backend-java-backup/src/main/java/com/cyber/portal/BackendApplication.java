package com.cyber.portal;

import com.cyber.portal.entity.Role;
import com.cyber.portal.entity.User;
import com.cyber.portal.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed a default admin if not exists
            if (userRepository.findByEmail("admin@gmail.com").isEmpty()) {
                User admin = new User();
                admin.setName("Admin Officer");
                admin.setEmail("admin@gmail.com");
                admin.setPhone("9999999999");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(Role.ROLE_ADMIN);
                admin.setCreatedAt(LocalDateTime.now());
                userRepository.save(admin);
                System.out.println("Default Admin account seeded (admin@gmail.com / admin123)");
            }

            // Seed a default citizen if not exists
            if (userRepository.findByEmail("user@gmail.com").isEmpty()) {
                User citizen = new User();
                citizen.setName("Abhishek Baghel");
                citizen.setEmail("user@gmail.com");
                citizen.setPhone("9876543210");
                citizen.setPassword(passwordEncoder.encode("user1234"));
                citizen.setRole(Role.ROLE_CITIZEN);
                citizen.setCreatedAt(LocalDateTime.now());
                userRepository.save(citizen);
                System.out.println("Default Citizen account seeded (user@gmail.com / user1234)");
            }
        };
    }
}
