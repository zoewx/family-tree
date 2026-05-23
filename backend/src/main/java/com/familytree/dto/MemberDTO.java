package com.familytree.dto;

import com.familytree.model.FamilyTreeMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MemberDTO {
    private UUID id;
    private UUID userId;
    private String username;
    private String displayName;
    private FamilyTreeMember.Role role;
    private UUID linkedPersonId;
    private String linkedPersonName;
    private LocalDateTime joinedAt;
}
