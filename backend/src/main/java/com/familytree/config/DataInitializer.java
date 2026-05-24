package com.familytree.config;

import com.familytree.model.User;
import com.familytree.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void init() {
        // Migrate existing users that were created before status/role columns existed
        userRepository.findByStatusIsNull().forEach(u -> {
            u.setStatus(User.UserStatus.ACTIVE);
            u.setRole(User.UserRole.USER);
            userRepository.save(u);
        });

        // Create admin account if not exists
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@familytree.app")
                    .password(passwordEncoder.encode("de0cfd0363c44bbd89d9c7079d232815"))
                    .displayName("Admin")
                    .status(User.UserStatus.ACTIVE)
                    .role(User.UserRole.ADMIN)
                    .build();
            userRepository.save(admin);
        }
    }
}
