package com.familytree.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FamilyTreeDTO {
    private UUID id;
    private String name;
    private String description;
    private String creatorName;
    private int memberCount;
    private int personCount;
    private String myRole;
    private String shareToken;
    private LocalDateTime createdAt;
}
