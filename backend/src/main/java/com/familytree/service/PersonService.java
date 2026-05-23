package com.familytree.service;

import com.familytree.dto.LinkRequestDTO;
import com.familytree.dto.PersonCreateRequest;
import com.familytree.dto.PersonDTO;
import com.familytree.model.*;
import com.familytree.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PersonService {

    private final PersonRepository personRepository;
    private final FamilyTreeRepository treeRepository;
    private final FamilyTreeMemberRepository memberRepository;
    private final PersonPhotoRepository personPhotoRepository;
    private final LinkRequestRepository linkRequestRepository;

    public List<PersonDTO> getAllPersons(UUID treeId, UUID userId) {
        checkAccess(userId, treeId);
        return personRepository.findByFamilyTreeId(treeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PersonDTO getPerson(UUID personId, UUID userId) {
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new RuntimeException("Person not found"));
        checkAccess(userId, person.getFamilyTree().getId());
        return toDetailDTO(person);
    }

    @Transactional
    public PersonDTO createPerson(UUID treeId, PersonCreateRequest request, UUID userId) {
        checkAdminAccess(userId, treeId);

        FamilyTree tree = treeRepository.findById(treeId)
                .orElseThrow(() -> new RuntimeException("Family tree not found"));

        Person person = Person.builder()
                .familyTree(tree)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .englishName(request.getEnglishName())
                .gender(request.getGender())
                .birthDate(request.getBirthDate())
                .deathDate(request.getDeathDate())
                .bio(request.getBio())
                .phone(request.getPhone())
                .email(request.getEmail())
                .country(request.getCountry())
                .province(request.getProvince())
                .city(request.getCity())
                .generation(request.getGeneration() != null ? request.getGeneration() : 0)
                .build();

        if (request.getFatherId() != null) {
            person.setFather(personRepository.findById(request.getFatherId()).orElse(null));
        }
        if (request.getMotherId() != null) {
            person.setMother(personRepository.findById(request.getMotherId()).orElse(null));
        }
        if (request.getSpouseId() != null) {
            Person spouse = personRepository.findById(request.getSpouseId()).orElse(null);
            if (spouse != null) {
                person.setSpouse(spouse);
                spouse.setSpouse(person);
                personRepository.save(spouse);
            }
        }

        person = personRepository.save(person);
        return toDTO(person);
    }

    @Transactional
    public PersonDTO updatePerson(UUID personId, PersonCreateRequest request, UUID userId) {
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new RuntimeException("Person not found"));
        UUID treeId = person.getFamilyTree().getId();

        if (!canEditPerson(userId, person)) {
            throw new RuntimeException("Access denied: cannot edit this person");
        }

        person.setFirstName(request.getFirstName());
        person.setLastName(request.getLastName());
        person.setEnglishName(request.getEnglishName());
        person.setGender(request.getGender());
        person.setBirthDate(request.getBirthDate());
        person.setDeathDate(request.getDeathDate());
        person.setBio(request.getBio());
        person.setPhone(request.getPhone());
        person.setEmail(request.getEmail());
        person.setCountry(request.getCountry());
        person.setProvince(request.getProvince());
        person.setCity(request.getCity());
        if (request.getGeneration() != null) {
            person.setGeneration(request.getGeneration());
        }

        if (request.getFatherId() != null) {
            person.setFather(personRepository.findById(request.getFatherId()).orElse(null));
        } else {
            person.setFather(null);
        }
        if (request.getMotherId() != null) {
            person.setMother(personRepository.findById(request.getMotherId()).orElse(null));
        } else {
            person.setMother(null);
        }
        if (request.getSpouseId() != null) {
            Person newSpouse = personRepository.findById(request.getSpouseId()).orElse(null);
            Person oldSpouse = person.getSpouse();
            if (oldSpouse != null && !oldSpouse.getId().equals(request.getSpouseId())) {
                oldSpouse.setSpouse(null);
                personRepository.save(oldSpouse);
            }
            if (newSpouse != null) {
                person.setSpouse(newSpouse);
                newSpouse.setSpouse(person);
                personRepository.save(newSpouse);
            }
        } else {
            Person oldSpouse = person.getSpouse();
            if (oldSpouse != null) {
                oldSpouse.setSpouse(null);
                personRepository.save(oldSpouse);
            }
            person.setSpouse(null);
        }

        person = personRepository.save(person);
        return toDetailDTO(person);
    }

    public boolean hasChildren(UUID personId) {
        return !personRepository.findChildren(personId).isEmpty();
    }

    @Transactional
    public void deletePerson(UUID personId, UUID userId, boolean cascade) {
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new RuntimeException("Person not found"));
        UUID treeId = person.getFamilyTree().getId();

        if (!canEditPerson(userId, person)) {
            throw new RuntimeException("Access denied: cannot delete this person");
        }

        List<Person> children = personRepository.findChildren(personId);
        if (!children.isEmpty() && !cascade) {
            throw new RuntimeException("PERSON_HAS_CHILDREN:" + children.size());
        }

        // Unlink spouse
        if (person.getSpouse() != null) {
            Person spouse = person.getSpouse();
            spouse.setSpouse(null);
            personRepository.save(spouse);
        }

        // Cascade delete children if requested
        if (cascade && !children.isEmpty()) {
            for (Person child : children) {
                deletePerson(child.getId(), userId, true);
            }
        }

        // Unlink from member if linked
        if (person.getLinkedUser() != null) {
            memberRepository.findByUserIdAndFamilyTreeId(person.getLinkedUser().getId(), treeId)
                    .ifPresent(m -> {
                        m.setLinkedPerson(null);
                        memberRepository.save(m);
                    });
        }

        personRepository.delete(person);
    }

    @Transactional
    public PersonDTO updatePhoto(UUID personId, String photoUrl, UUID userId) {
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new RuntimeException("Person not found"));
        if (!canEditPerson(userId, person)) {
            throw new RuntimeException("Access denied");
        }
        person.setPhotoUrl(photoUrl);
        person = personRepository.save(person);
        return toDTO(person);
    }

    @Transactional
    public LinkRequestDTO requestLink(UUID treeId, UUID personId, UUID userId) {
        checkAccess(userId, treeId);
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new RuntimeException("Person not found"));
        if (person.getLinkedUser() != null) {
            throw new RuntimeException("This person is already linked to a user");
        }
        if (linkRequestRepository.existsByRequesterIdAndPersonIdAndStatus(userId, personId, LinkRequest.Status.PENDING)) {
            throw new RuntimeException("You already have a pending link request for this person");
        }
        var member = memberRepository.findByUserIdAndFamilyTreeId(userId, treeId)
                .orElseThrow(() -> new RuntimeException("Not a member"));
        LinkRequest lr = LinkRequest.builder()
                .familyTree(person.getFamilyTree())
                .person(person)
                .requester(member.getUser())
                .build();
        lr = linkRequestRepository.save(lr);
        return toLinkRequestDTO(lr);
    }

    public List<LinkRequestDTO> getPendingLinkRequests(UUID treeId, UUID userId) {
        checkOwnerAccess(userId, treeId);
        return linkRequestRepository.findByFamilyTreeIdAndStatus(treeId, LinkRequest.Status.PENDING)
                .stream().map(this::toLinkRequestDTO).collect(Collectors.toList());
    }

    @Transactional
    public void approveLinkRequest(UUID requestId, UUID userId) {
        LinkRequest lr = linkRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        checkOwnerAccess(userId, lr.getFamilyTree().getId());
        Person person = lr.getPerson();
        if (person.getLinkedUser() != null) {
            throw new RuntimeException("This person is already linked");
        }
        var member = memberRepository.findByUserIdAndFamilyTreeId(lr.getRequester().getId(), lr.getFamilyTree().getId())
                .orElseThrow(() -> new RuntimeException("Requester is no longer a member"));
        person.setLinkedUser(lr.getRequester());
        member.setLinkedPerson(person);
        personRepository.save(person);
        memberRepository.save(member);
        lr.setStatus(LinkRequest.Status.APPROVED);
        lr.setResolvedAt(java.time.LocalDateTime.now());
        linkRequestRepository.save(lr);
    }

    @Transactional
    public void rejectLinkRequest(UUID requestId, UUID userId) {
        LinkRequest lr = linkRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        checkOwnerAccess(userId, lr.getFamilyTree().getId());
        lr.setStatus(LinkRequest.Status.REJECTED);
        lr.setResolvedAt(java.time.LocalDateTime.now());
        linkRequestRepository.save(lr);
    }

    @Transactional
    public void linkUserToPerson(UUID treeId, UUID personId, UUID userId) {
        checkAccess(userId, treeId);
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new RuntimeException("Person not found"));
        if (person.getLinkedUser() != null) {
            throw new RuntimeException("This person is already linked to a user");
        }
        var user = memberRepository.findByUserIdAndFamilyTreeId(userId, treeId)
                .orElseThrow(() -> new RuntimeException("Not a member"));
        person.setLinkedUser(user.getUser());
        user.setLinkedPerson(person);
        personRepository.save(person);
        memberRepository.save(user);
    }

    private void checkOwnerAccess(UUID userId, UUID treeId) {
        FamilyTreeMember member = memberRepository.findByUserIdAndFamilyTreeId(userId, treeId)
                .orElseThrow(() -> new RuntimeException("Access denied"));
        if (member.getRole() != FamilyTreeMember.Role.OWNER) {
            throw new RuntimeException("Owner privileges required");
        }
    }

    private LinkRequestDTO toLinkRequestDTO(LinkRequest lr) {
        String personName = (lr.getPerson().getLastName() != null ? lr.getPerson().getLastName() : "")
                + (lr.getPerson().getFirstName() != null ? lr.getPerson().getFirstName() : "");
        return LinkRequestDTO.builder()
                .id(lr.getId())
                .personId(lr.getPerson().getId())
                .personName(personName)
                .requesterId(lr.getRequester().getId())
                .requesterName(lr.getRequester().getDisplayName() != null ? lr.getRequester().getDisplayName() : lr.getRequester().getUsername())
                .status(lr.getStatus().name())
                .createdAt(lr.getCreatedAt())
                .build();
    }

    private boolean canEditPerson(UUID userId, Person person) {
        UUID treeId = person.getFamilyTree().getId();
        FamilyTreeMember member = memberRepository.findByUserIdAndFamilyTreeId(userId, treeId).orElse(null);
        if (member == null) return false;
        if (member.getRole() == FamilyTreeMember.Role.OWNER ||
            member.getRole() == FamilyTreeMember.Role.ADMIN) {
            return true;
        }
        return person.getLinkedUser() != null && person.getLinkedUser().getId().equals(userId);
    }

    private void checkAccess(UUID userId, UUID treeId) {
        if (!memberRepository.existsByUserIdAndFamilyTreeId(userId, treeId)) {
            throw new RuntimeException("Access denied");
        }
    }

    private void checkAdminAccess(UUID userId, UUID treeId) {
        FamilyTreeMember member = memberRepository.findByUserIdAndFamilyTreeId(userId, treeId)
                .orElseThrow(() -> new RuntimeException("Access denied"));
        if (member.getRole() == FamilyTreeMember.Role.MEMBER) {
            throw new RuntimeException("Admin privileges required");
        }
    }

    private PersonDTO toDTO(Person p) {
        return PersonDTO.builder()
                .id(p.getId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .englishName(p.getEnglishName())
                .gender(p.getGender())
                .birthDate(p.getBirthDate())
                .deathDate(p.getDeathDate())
                .photoUrl(p.getPhotoUrl())
                .bio(p.getBio())
                .phone(p.getPhone())
                .email(p.getEmail())
                .country(p.getCountry())
                .province(p.getProvince())
                .city(p.getCity())
                .generation(p.getGeneration())
                .fatherId(p.getFather() != null ? p.getFather().getId() : null)
                .fatherName(p.getFather() != null ? p.getFather().getFirstName() + " " + nullSafe(p.getFather().getLastName()) : null)
                .motherId(p.getMother() != null ? p.getMother().getId() : null)
                .motherName(p.getMother() != null ? p.getMother().getFirstName() + " " + nullSafe(p.getMother().getLastName()) : null)
                .spouseId(p.getSpouse() != null ? p.getSpouse().getId() : null)
                .spouseName(p.getSpouse() != null ? p.getSpouse().getFirstName() + " " + nullSafe(p.getSpouse().getLastName()) : null)
                .linkedUserId(p.getLinkedUser() != null ? p.getLinkedUser().getId() : null)
                .build();
    }

    private PersonDTO toDetailDTO(Person p) {
        PersonDTO dto = toDTO(p);

        List<Person> children = personRepository.findChildren(p.getId());
        dto.setChildren(children.stream()
                .map(c -> PersonDTO.PersonSummary.builder()
                        .id(c.getId())
                        .firstName(c.getFirstName())
                        .lastName(c.getLastName())
                        .englishName(c.getEnglishName())
                        .gender(c.getGender())
                        .photoUrl(c.getPhotoUrl())
                        .build())
                .collect(Collectors.toList()));

        if (p.getFather() != null || p.getMother() != null) {
            UUID fatherId = p.getFather() != null ? p.getFather().getId() : null;
            UUID motherId = p.getMother() != null ? p.getMother().getId() : null;
            if (fatherId != null || motherId != null) {
                List<Person> siblings = personRepository.findSiblings(
                        fatherId != null ? fatherId : UUID.randomUUID(),
                        motherId != null ? motherId : UUID.randomUUID(),
                        p.getId());
                dto.setSiblings(siblings.stream()
                        .map(s -> PersonDTO.PersonSummary.builder()
                                .id(s.getId())
                                .firstName(s.getFirstName())
                                .lastName(s.getLastName())
                                .englishName(s.getEnglishName())
                                .gender(s.getGender())
                                .photoUrl(s.getPhotoUrl())
                                .build())
                        .collect(Collectors.toList()));
            }
        }

        // gallery photos
        List<PersonPhoto> photos = personPhotoRepository.findByPersonIdOrderByCreatedAtDesc(p.getId());
        dto.setGalleryPhotos(photos.stream()
                .map(ph -> PersonDTO.PhotoItem.builder()
                        .id(ph.getId())
                        .url(ph.getUrl())
                        .caption(ph.getCaption())
                        .build())
                .collect(Collectors.toList()));

        return dto;
    }

    @Transactional
    public PersonDTO addGalleryPhoto(UUID personId, String url, UUID userId) {
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new RuntimeException("Person not found"));
        if (!canEditPerson(userId, person)) {
            throw new RuntimeException("Access denied");
        }
        PersonPhoto photo = PersonPhoto.builder()
                .person(person)
                .url(url)
                .build();
        personPhotoRepository.save(photo);
        return toDetailDTO(person);
    }

    @Transactional
    public void deleteGalleryPhoto(UUID photoId, UUID userId) {
        PersonPhoto photo = personPhotoRepository.findById(photoId)
                .orElseThrow(() -> new RuntimeException("Photo not found"));
        if (!canEditPerson(userId, photo.getPerson())) {
            throw new RuntimeException("Access denied");
        }
        personPhotoRepository.delete(photo);
    }

    public List<PersonDTO.PhotoItem> getGalleryPhotos(UUID personId) {
        return personPhotoRepository.findByPersonIdOrderByCreatedAtDesc(personId).stream()
                .map(ph -> PersonDTO.PhotoItem.builder()
                        .id(ph.getId())
                        .url(ph.getUrl())
                        .caption(ph.getCaption())
                        .build())
                .collect(Collectors.toList());
    }

    private String nullSafe(String s) {
        return s != null ? s : "";
    }
}
