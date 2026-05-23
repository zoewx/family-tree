package com.familytree.controller;

import com.familytree.dto.InvitationDTO;
import com.familytree.security.CustomUserDetails;
import com.familytree.service.InvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping("/trees/{treeId}/invitations")
    public ResponseEntity<InvitationDTO> createInvitation(
            @PathVariable UUID treeId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(
                invitationService.createInvitation(treeId, body.get("email"), user.getId()));
    }

    @GetMapping("/trees/{treeId}/invitations")
    public ResponseEntity<List<InvitationDTO>> getTreeInvitations(
            @PathVariable UUID treeId,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(invitationService.getTreeInvitations(treeId, user.getId()));
    }

    @GetMapping("/invitations/validate/{code}")
    public ResponseEntity<InvitationDTO> validateInvitation(@PathVariable String code) {
        return ResponseEntity.ok(invitationService.validateInvitation(code));
    }

    @PostMapping("/invitations/{code}/accept")
    public ResponseEntity<Void> acceptInvitation(
            @PathVariable String code,
            @AuthenticationPrincipal CustomUserDetails user) {
        invitationService.acceptInvitation(code, user.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/invitations/{invitationId}")
    public ResponseEntity<Void> cancelInvitation(
            @PathVariable UUID invitationId,
            @AuthenticationPrincipal CustomUserDetails user) {
        invitationService.cancelInvitation(invitationId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
