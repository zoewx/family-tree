package com.familytree.service;

import com.familytree.dto.AuthRequest;
import com.familytree.dto.AuthResponse;
import com.familytree.dto.RegisterRequest;
import com.familytree.model.FamilyTreeMember;
import com.familytree.model.Invitation;
import com.familytree.model.User;
import com.familytree.repository.FamilyTreeMemberRepository;
import com.familytree.repository.InvitationRepository;
import com.familytree.repository.UserRepository;
import com.familytree.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final FamilyTreeMemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public Map<String, String> register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName() != null ? request.getDisplayName() : request.getUsername())
                .status(User.UserStatus.PENDING)
                .role(User.UserRole.USER)
                .build();
        user = userRepository.save(user);

        if (request.getInvitationCode() != null && !request.getInvitationCode().isBlank()) {
            acceptInvitation(user, request.getInvitationCode());
        }

        return Map.of(
                "message", "Registration successful. Your account is pending admin approval.",
                "username", user.getUsername()
        );
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (user.getStatus() == User.UserStatus.PENDING) {
            throw new RuntimeException("Your account is pending admin approval");
        }
        if (user.getStatus() == User.UserStatus.REJECTED) {
            throw new RuntimeException("Your account has been rejected");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }
        var userId = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return buildAuthResponse(user);
    }

    private void acceptInvitation(User user, String code) {
        Invitation invitation = invitationRepository.findByCode(code).orElse(null);
        if (invitation == null || invitation.isExpired()
                || invitation.getStatus() != Invitation.Status.PENDING) {
            return;
        }

        FamilyTreeMember member = FamilyTreeMember.builder()
                .user(user)
                .familyTree(invitation.getFamilyTree())
                .role(FamilyTreeMember.Role.MEMBER)
                .build();
        memberRepository.save(member);

        invitation.setStatus(Invitation.Status.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitationRepository.save(invitation);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getUsername());
        return AuthResponse.builder()
                .userId(user.getId().toString())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
