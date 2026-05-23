package com.familytree.dto;

import com.familytree.model.Invitation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InvitationDTO {
    private UUID id;
    private String code;
    private UUID familyTreeId;
    private String familyTreeName;
    private String invitedByName;
    private String inviteeEmail;
    private Invitation.Status status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
