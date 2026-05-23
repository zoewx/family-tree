package com.familytree.controller;

import com.familytree.security.CustomUserDetails;
import com.familytree.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(userService.getProfile(user.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(user.getId(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(user.getId(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PutMapping("/email")
    public ResponseEntity<UserProfileResponse> changeEmail(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody ChangeEmailRequest request) {
        return ResponseEntity.ok(userService.changeEmail(user.getId(), request));
    }

    // --- DTOs ---

    @Data
    public static class UserProfileResponse {
        private String username;
        private String email;
        private String displayName;
        private String avatarUrl;
        private String createdAt;
    }

    @Data
    public static class UpdateProfileRequest {
        @NotBlank @Size(max = 50)
        private String displayName;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank
        private String currentPassword;
        @NotBlank @Size(min = 6, max = 100)
        private String newPassword;
    }

    @Data
    public static class ChangeEmailRequest {
        @NotBlank @Email @Size(max = 100)
        private String newEmail;
        @NotBlank
        private String password;
    }
}
