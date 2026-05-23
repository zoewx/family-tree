package com.familytree.controller;

import com.familytree.dto.LinkRequestDTO;
import com.familytree.dto.PersonCreateRequest;
import com.familytree.dto.PersonDTO;
import com.familytree.security.CustomUserDetails;
import com.familytree.service.PersonService;
import com.familytree.service.StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trees/{treeId}/persons")
@RequiredArgsConstructor
public class PersonController {

    private final PersonService personService;
    private final StorageService storageService;

    @GetMapping
    public ResponseEntity<List<PersonDTO>> getAllPersons(
            @PathVariable UUID treeId,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(personService.getAllPersons(treeId, user.getId()));
    }

    @GetMapping("/{personId}")
    public ResponseEntity<PersonDTO> getPerson(
            @PathVariable UUID treeId,
            @PathVariable UUID personId,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(personService.getPerson(personId, user.getId()));
    }

    @PostMapping
    public ResponseEntity<PersonDTO> createPerson(
            @PathVariable UUID treeId,
            @Valid @RequestBody PersonCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(personService.createPerson(treeId, request, user.getId()));
    }

    @PutMapping("/{personId}")
    public ResponseEntity<PersonDTO> updatePerson(
            @PathVariable UUID treeId,
            @PathVariable UUID personId,
            @Valid @RequestBody PersonCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(personService.updatePerson(personId, request, user.getId()));
    }

    @DeleteMapping("/{personId}")
    public ResponseEntity<Void> deletePerson(
            @PathVariable UUID treeId,
            @PathVariable UUID personId,
            @RequestParam(defaultValue = "false") boolean cascade,
            @AuthenticationPrincipal CustomUserDetails user) {
        personService.deletePerson(personId, user.getId(), cascade);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{personId}/photo")
    public ResponseEntity<PersonDTO> uploadPhoto(
            @PathVariable UUID treeId,
            @PathVariable UUID personId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails user) throws IOException {
        String url = storageService.uploadFile(file, "photos/" + treeId);
        return ResponseEntity.ok(personService.updatePhoto(personId, url, user.getId()));
    }

    @PostMapping("/{personId}/gallery")
    public ResponseEntity<PersonDTO> uploadGalleryPhoto(
            @PathVariable UUID treeId,
            @PathVariable UUID personId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails user) throws IOException {
        String url = storageService.uploadFile(file, "gallery/" + treeId + "/" + personId);
        return ResponseEntity.ok(personService.addGalleryPhoto(personId, url, user.getId()));
    }

    @DeleteMapping("/{personId}/gallery/{photoId}")
    public ResponseEntity<Void> deleteGalleryPhoto(
            @PathVariable UUID treeId,
            @PathVariable UUID personId,
            @PathVariable UUID photoId,
            @AuthenticationPrincipal CustomUserDetails user) {
        personService.deleteGalleryPhoto(photoId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{personId}/link")
    public ResponseEntity<Void> linkUser(
            @PathVariable UUID treeId,
            @PathVariable UUID personId,
            @AuthenticationPrincipal CustomUserDetails user) {
        personService.linkUserToPerson(treeId, personId, user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{personId}/link-request")
    public ResponseEntity<LinkRequestDTO> requestLink(
            @PathVariable UUID treeId,
            @PathVariable UUID personId,
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(personService.requestLink(treeId, personId, user.getId()));
    }
}
