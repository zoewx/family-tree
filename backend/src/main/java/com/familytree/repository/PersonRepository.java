package com.familytree.repository;

import com.familytree.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PersonRepository extends JpaRepository<Person, UUID> {

    List<Person> findByFamilyTreeId(UUID familyTreeId);

    @Query("SELECT p FROM Person p WHERE p.familyTree.id = :treeId AND p.father IS NULL AND p.mother IS NULL")
    List<Person> findRootPersons(@Param("treeId") UUID treeId);

    Optional<Person> findByLinkedUserId(UUID userId);

    @Query("SELECT p FROM Person p WHERE p.familyTree.id = :treeId AND p.linkedUser.id = :userId")
    Optional<Person> findByFamilyTreeIdAndLinkedUserId(@Param("treeId") UUID treeId, @Param("userId") UUID userId);

    @Query("SELECT p FROM Person p WHERE p.father.id = :parentId OR p.mother.id = :parentId")
    List<Person> findChildren(@Param("parentId") UUID parentId);

    @Query("SELECT p FROM Person p WHERE (p.father.id = :fatherId OR p.mother.id = :motherId) AND p.id != :personId")
    List<Person> findSiblings(@Param("fatherId") UUID fatherId, @Param("motherId") UUID motherId, @Param("personId") UUID personId);
}
