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
    public AuthResponse register(RegisterRequest request) {
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
                .build();
        user = userRepository.save(user);

        if (request.getInvitationCode() != null && !request.getInvitationCode().isBlank()) {
            acceptInvitation(user, request.getInvitationCode());
        }

        return buildAuthResponse(user);
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

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
                .build();
    }
}
