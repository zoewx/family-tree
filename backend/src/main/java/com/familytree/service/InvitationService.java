package com.familytree.service;

import com.familytree.dto.InvitationDTO;
import com.familytree.model.*;
import com.familytree.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final FamilyTreeRepository treeRepository;
    private final FamilyTreeMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final FamilyTreeService treeService;

    @Transactional
    public InvitationDTO createInvitation(UUID treeId, String inviteeEmail, UUID invitedByUserId) {
        treeService.checkAdminAccess(invitedByUserId, treeId);

        FamilyTree tree = treeRepository.findById(treeId)
                .orElseThrow(() -> new RuntimeException("Family tree not found"));
        User inviter = userRepository.findById(invitedByUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Invitation invitation = Invitation.builder()
                .code(UUID.randomUUID().toString().replace("-", "").substring(0, 12))
                .familyTree(tree)
                .invitedBy(inviter)
                .inviteeEmail(inviteeEmail)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        invitation = invitationRepository.save(invitation);

        return toDTO(invitation);
    }

    public InvitationDTO validateInvitation(String code) {
        Invitation invitation = invitationRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Invalid invitation code"));
        if (invitation.isExpired()) {
            throw new RuntimeException("Invitation has expired");
        }
        if (invitation.getStatus() != Invitation.Status.PENDING) {
            throw new RuntimeException("Invitation is no longer valid");
        }
        return toDTO(invitation);
    }

    @Transactional
    public void acceptInvitation(String code, UUID userId) {
        Invitation invitation = invitationRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Invalid invitation code"));
        if (invitation.isExpired() || invitation.getStatus() != Invitation.Status.PENDING) {
            throw new RuntimeException("Invitation is no longer valid");
        }

        UUID treeId = invitation.getFamilyTree().getId();
        if (memberRepository.existsByUserIdAndFamilyTreeId(userId, treeId)) {
            throw new RuntimeException("Already a member of this family tree");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

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

    public List<InvitationDTO> getTreeInvitations(UUID treeId, UUID userId) {
        treeService.checkAdminAccess(userId, treeId);
        return invitationRepository.findByFamilyTreeId(treeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelInvitation(UUID invitationId, UUID userId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));
        treeService.checkAdminAccess(userId, invitation.getFamilyTree().getId());
        invitation.setStatus(Invitation.Status.CANCELLED);
        invitationRepository.save(invitation);
    }

    private InvitationDTO toDTO(Invitation inv) {
        return InvitationDTO.builder()
                .id(inv.getId())
                .code(inv.getCode())
                .familyTreeId(inv.getFamilyTree().getId())
                .familyTreeName(inv.getFamilyTree().getName())
                .invitedByName(inv.getInvitedBy().getDisplayName())
                .inviteeEmail(inv.getInviteeEmail())
                .status(inv.getStatus())
                .createdAt(inv.getCreatedAt())
                .expiresAt(inv.getExpiresAt())
                .build();
    }
}
