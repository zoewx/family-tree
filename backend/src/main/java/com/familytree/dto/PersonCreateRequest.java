package com.familytree.dto;

import com.familytree.model.Person;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class PersonCreateRequest {
    @NotBlank
    private String firstName;
    private String lastName;
    private String englishName;
    private Person.Gender gender;
    private LocalDate birthDate;
    private LocalDate deathDate;
    private String bio;
    private String phone;
    private String email;
    private String country;
    private String province;
    private String city;
    private UUID fatherId;
    private UUID motherId;
    private UUID spouseId;
    private Integer generation;
}
