package com.familytree.repository;

import com.familytree.model.FamilyTreeMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FamilyTreeMemberRepository extends JpaRepository<FamilyTreeMember, UUID> {

    Optional<FamilyTreeMember> findByUserIdAndFamilyTreeId(UUID userId, UUID familyTreeId);

    List<FamilyTreeMember> findByFamilyTreeId(UUID familyTreeId);

    List<FamilyTreeMember> findByUserId(UUID userId);

    boolean existsByUserIdAndFamilyTreeId(UUID userId, UUID familyTreeId);
}
