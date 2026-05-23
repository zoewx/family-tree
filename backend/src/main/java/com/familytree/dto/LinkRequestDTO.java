package com.familytree.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LinkRequestDTO {
    private UUID id;
    private UUID personId;
    private String personName;
    private UUID requesterId;
    private String requesterName;
    private String status;
    private LocalDateTime createdAt;
}
