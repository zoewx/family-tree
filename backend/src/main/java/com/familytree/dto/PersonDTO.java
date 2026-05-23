package com.familytree.dto;

import com.familytree.model.Person;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PersonDTO {
    private UUID id;
    private String firstName;
    private String lastName;
    private String englishName;
    private Person.Gender gender;
    private LocalDate birthDate;
    private LocalDate deathDate;
    private String photoUrl;
    private String bio;
    private String phone;
    private String email;
    private String country;
    private String province;
    private String city;
    private Integer generation;

    private UUID fatherId;
    private String fatherName;
    private UUID motherId;
    private String motherName;
    private UUID spouseId;
    private String spouseName;

    private List<PersonSummary> children;
    private List<PersonSummary> siblings;

    private UUID linkedUserId;

    private List<PhotoItem> galleryPhotos;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PhotoItem {
        private UUID id;
        private String url;
        private String caption;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PersonSummary {
        private UUID id;
        private String firstName;
        private String lastName;
        private String englishName;
        private Person.Gender gender;
        private String photoUrl;
    }
}
