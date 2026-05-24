package com.familytree.repository;

import com.familytree.model.LinkRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface LinkRequestRepository extends JpaRepository<LinkRequest, UUID> {
    List<LinkRequest> findByFamilyTreeIdAndStatus(UUID familyTreeId, LinkRequest.Status status);
    List<LinkRequest> findByFamilyTreeId(UUID familyTreeId);
    boolean existsByRequesterIdAndPersonIdAndStatus(UUID requesterId, UUID personId, LinkRequest.Status status);
    List<LinkRequest> findByRequesterIdAndFamilyTreeIdAndStatus(UUID requesterId, UUID familyTreeId, LinkRequest.Status status);
}
