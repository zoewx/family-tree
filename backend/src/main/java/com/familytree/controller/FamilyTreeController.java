package com.familytree.controller;

import com.familytree.dto.*;
import com.familytree.model.FamilyTreeMember;
import com.familytree.security.CustomUserDetails;
import com.familytree.service.ExcelImportService;
import com.familytree.service.FamilyTreeService;
import com.familytree.service.PersonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/trees")
@RequiredArgsConstructor
public class FamilyTreeController {

    private final FamilyTreeService treeService;
    private final ExcelImportService excelImportService;
    private final PersonService personService;

    @PostMapping
    public ResponseEntity<FamilyTreeDTO> createTree(
            @Valid @RequestBody FamilyTreeCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(treeService.createTree(request, user.getId()));
    }

    @GetMapping
    public ResponseEntity<List<FamilyTreeDTO>> getMyTrees(
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(treeService.getMyTrees(user.getId()));
    }

    @GetMapping("/{treeId}")
    public ResponseEntity<FamilyTreeDTO> getTree(
            @PathVariable UUID treeId,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(treeService.getTree(treeId, user.getId()));
    }

    @PutMapping("/{treeId}")
    public ResponseEntity<FamilyTreeDTO> updateTree(
            @PathVariable UUID treeId,
            @Valid @RequestBody FamilyTreeCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(treeService.updateTree(treeId, request, user.getId()));
    }

    @DeleteMapping("/{treeId}")
    public ResponseEntity<Void> deleteTree(
            @PathVariable UUID treeId,
            @AuthenticationPrincipal CustomUserDetails user) {
        treeService.deleteTree(treeId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{treeId}/members")
    public ResponseEntity<List<MemberDTO>> getMembers(
            @PathVariable UUID treeId,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(treeService.getMembers(treeId, user.getId()));
    }

    @PutMapping("/{treeId}/members/{memberId}/role")
    public ResponseEntity<MemberDTO> updateMemberRole(
            @PathVariable UUID treeId,
            @PathVariable UUID memberId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails user) {
        FamilyTreeMember.Role role = FamilyTreeMember.Role.valueOf(body.get("role"));
        return ResponseEntity.ok(treeService.updateMemberRole(treeId, memberId, role, user.getId()));
    }

    @DeleteMapping("/{treeId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID treeId,
            @PathVariable UUID memberId,
            @AuthenticationPrincipal CustomUserDetails user) {
        treeService.removeMember(treeId, memberId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{treeId}/share")
    public ResponseEntity<FamilyTreeDTO> generateShareToken(
            @PathVariable UUID treeId,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(treeService.generateShareToken(treeId, user.getId()));
    }

    @DeleteMapping("/{treeId}/share")
    public ResponseEntity<FamilyTreeDTO> revokeShareToken(
            @PathVariable UUID treeId,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(treeService.revokeShareToken(treeId, user.getId()));
    }

    @PostMapping("/{treeId}/import")
    public ResponseEntity<Map<String, Object>> importExcel(
            @PathVariable UUID treeId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails user) {
        int count = excelImportService.importFromExcel(treeId, file, user.getId());
        return ResponseEntity.ok(Map.of("imported", count));
    }

    @GetMapping("/{treeId}/link-requests")
    public ResponseEntity<List<LinkRequestDTO>> getLinkRequests(
            @PathVariable UUID treeId,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(personService.getPendingLinkRequests(treeId, user.getId()));
    }

    @PostMapping("/{treeId}/link-requests/{requestId}/approve")
    public ResponseEntity<Void> approveLinkRequest(
            @PathVariable UUID treeId,
            @PathVariable UUID requestId,
            @AuthenticationPrincipal CustomUserDetails user) {
        personService.approveLinkRequest(requestId, user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{treeId}/link-requests/{requestId}/reject")
    public ResponseEntity<Void> rejectLinkRequest(
            @PathVariable UUID treeId,
            @PathVariable UUID requestId,
            @AuthenticationPrincipal CustomUserDetails user) {
        personService.rejectLinkRequest(requestId, user.getId());
        return ResponseEntity.ok().build();
    }
}
