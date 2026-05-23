package com.familytree.repository;

import com.familytree.model.PersonPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PersonPhotoRepository extends JpaRepository<PersonPhoto, UUID> {
    List<PersonPhoto> findByPersonIdOrderByCreatedAtDesc(UUID personId);
}
