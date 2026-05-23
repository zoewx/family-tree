package com.familytree.repository;

import com.familytree.model.FamilyTree;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FamilyTreeRepository extends JpaRepository<FamilyTree, UUID> {

    @Query("SELECT ft FROM FamilyTree ft JOIN ft.members m WHERE m.user.id = :userId")
    List<FamilyTree> findAllByUserId(@Param("userId") UUID userId);

    List<FamilyTree> findByCreatorId(UUID creatorId);

    Optional<FamilyTree> findByShareToken(String shareToken);
}
