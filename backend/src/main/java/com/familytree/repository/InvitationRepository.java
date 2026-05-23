package com.familytree.repository;

import com.familytree.model.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    Optional<Invitation> findByCode(String code);
    List<Invitation> findByFamilyTreeId(UUID familyTreeId);
    List<Invitation> findByInviteeEmail(String email);
}
