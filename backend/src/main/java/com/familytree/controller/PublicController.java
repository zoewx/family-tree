package com.familytree.controller;

import com.familytree.dto.FamilyTreeDTO;
import com.familytree.dto.PersonDTO;
import com.familytree.service.FamilyTreeService;
import com.familytree.service.PersonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/share")
@RequiredArgsConstructor
public class PublicController {

    private final FamilyTreeService treeService;
    private final PersonService personService;

    @GetMapping("/{shareToken}")
    public ResponseEntity<FamilyTreeDTO> getSharedTree(@PathVariable String shareToken) {
        return ResponseEntity.ok(treeService.getPublicTree(shareToken));
    }

    @GetMapping("/{shareToken}/persons")
    public ResponseEntity<List<PersonDTO>> getSharedPersons(@PathVariable String shareToken) {
        return ResponseEntity.ok(treeService.getPublicPersons(shareToken));
    }

    @GetMapping("/{shareToken}/persons/{personId}/gallery")
    public ResponseEntity<List<PersonDTO.PhotoItem>> getSharedGallery(
            @PathVariable String shareToken,
            @PathVariable UUID personId) {
        treeService.getPublicTree(shareToken);
        return ResponseEntity.ok(personService.getGalleryPhotos(personId));
    }
}
