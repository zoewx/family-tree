package com.familytree.service;

import com.familytree.dto.*;
import com.familytree.model.*;
import com.familytree.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FamilyTreeService {

    private final FamilyTreeRepository treeRepository;
    private final FamilyTreeMemberRepository memberRepository;
    private final PersonRepository personRepository;
    private final UserRepository userRepository;
    private final PersonPhotoRepository personPhotoRepository;
    private final LinkRequestRepository linkRequestRepository;

    @Transactional
    public FamilyTreeDTO createTree(FamilyTreeCreateRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FamilyTree tree = FamilyTree.builder()
                .name(request.getName())
                .description(request.getDescription())
                .creator(user)
                .build();
        tree = treeRepository.save(tree);

        FamilyTreeMember ownerMember = FamilyTreeMember.builder()
                .user(user)
                .familyTree(tree)
                .role(FamilyTreeMember.Role.OWNER)
                .build();
        memberRepository.save(ownerMember);

        return toDTO(tree, FamilyTreeMember.Role.OWNER);
    }

    public List<FamilyTreeDTO> getMyTrees(UUID userId) {
        List<FamilyTreeMember> memberships = memberRepository.findByUserId(userId);
        return memberships.stream()
                .map(m -> toDTO(m.getFamilyTree(), m.getRole()))
                .collect(Collectors.toList());
    }

    public FamilyTreeDTO getTree(UUID treeId, UUID userId) {
        FamilyTree tree = treeRepository.findById(treeId)
                .orElseThrow(() -> new RuntimeException("Family tree not found"));
        FamilyTreeMember membership = memberRepository.findByUserIdAndFamilyTreeId(userId, treeId)
                .orElseThrow(() -> new RuntimeException("Access denied"));
        return toDTO(tree, membership.getRole());
    }

    @Transactional
    public FamilyTreeDTO updateTree(UUID treeId, FamilyTreeCreateRequest request, UUID userId) {
        FamilyTree tree = treeRepository.findById(treeId)
                .orElseThrow(() -> new RuntimeException("Family tree not found"));
        checkAdminAccess(userId, treeId);

        tree.setName(request.getName());
        tree.setDescription(request.getDescription());
        tree = treeRepository.save(tree);

        FamilyTreeMember membership = memberRepository.findByUserIdAndFamilyTreeId(userId, treeId).orElse(null);
        return toDTO(tree, membership != null ? membership.getRole() : null);
    }

    @Transactional
    public void deleteTree(UUID treeId, UUID userId) {
        FamilyTree tree = treeRepository.findById(treeId)
                .orElseThrow(() -> new RuntimeException("Family tree not found"));
        checkOwnerAccess(userId, treeId);

        // Delete dependents to avoid FK constraint violations
        linkRequestRepository.deleteAll(linkRequestRepository.findByFamilyTreeId(treeId));
        List<Person> persons = personRepository.findByFamilyTreeId(treeId);
        for (Person p : persons) {
            personPhotoRepository.deleteAll(personPhotoRepository.findByPersonIdOrderByCreatedAtDesc(p.getId()));
        }
        // Clear self-referencing FKs
        for (Person p : persons) {
            p.setFather(null);
            p.setMother(null);
            p.setSpouse(null);
            p.setLinkedUser(null);
        }
        personRepository.saveAll(persons);
        personRepository.flush();
        personRepository.deleteAll(persons);
        memberRepository.deleteAll(memberRepository.findByFamilyTreeId(treeId));
        treeRepository.delete(tree);
    }

    public List<MemberDTO> getMembers(UUID treeId, UUID userId) {
        checkMemberAccess(userId, treeId);
        return memberRepository.findByFamilyTreeId(treeId).stream()
                .map(this::toMemberDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MemberDTO updateMemberRole(UUID treeId, UUID memberId, FamilyTreeMember.Role newRole, UUID userId) {
        checkOwnerAccess(userId, treeId);

        FamilyTreeMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        if (!member.getFamilyTree().getId().equals(treeId)) {
            throw new RuntimeException("Member does not belong to this tree");
        }
        if (member.getRole() == FamilyTreeMember.Role.OWNER) {
            throw new RuntimeException("Cannot change owner's role");
        }
        member.setRole(newRole);
        member = memberRepository.save(member);
        return toMemberDTO(member);
    }

    @Transactional
    public void removeMember(UUID treeId, UUID memberId, UUID userId) {
        checkOwnerAccess(userId, treeId);
        FamilyTreeMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        if (member.getRole() == FamilyTreeMember.Role.OWNER) {
            throw new RuntimeException("Cannot remove owner");
        }
        memberRepository.delete(member);
    }

    public FamilyTreeMember.Role getUserRole(UUID userId, UUID treeId) {
        return memberRepository.findByUserIdAndFamilyTreeId(userId, treeId)
                .map(FamilyTreeMember::getRole)
                .orElse(null);
    }

    public void checkMemberAccess(UUID userId, UUID treeId) {
        if (!memberRepository.existsByUserIdAndFamilyTreeId(userId, treeId)) {
            throw new RuntimeException("Access denied: not a member of this tree");
        }
    }

    public void checkAdminAccess(UUID userId, UUID treeId) {
        FamilyTreeMember member = memberRepository.findByUserIdAndFamilyTreeId(userId, treeId)
                .orElseThrow(() -> new RuntimeException("Access denied"));
        if (member.getRole() == FamilyTreeMember.Role.MEMBER) {
            throw new RuntimeException("Access denied: admin privileges required");
        }
    }

    @Transactional
    public FamilyTreeDTO generateShareToken(UUID treeId, UUID userId) {
        checkAdminAccess(userId, treeId);
        FamilyTree tree = treeRepository.findById(treeId)
                .orElseThrow(() -> new RuntimeException("Family tree not found"));
        tree.setShareToken(UUID.randomUUID().toString().replace("-", ""));
        tree = treeRepository.save(tree);
        FamilyTreeMember membership = memberRepository.findByUserIdAndFamilyTreeId(userId, treeId).orElse(null);
        return toDTO(tree, membership != null ? membership.getRole() : null);
    }

    @Transactional
    public FamilyTreeDTO revokeShareToken(UUID treeId, UUID userId) {
        checkAdminAccess(userId, treeId);
        FamilyTree tree = treeRepository.findById(treeId)
                .orElseThrow(() -> new RuntimeException("Family tree not found"));
        tree.setShareToken(null);
        tree = treeRepository.save(tree);
        FamilyTreeMember membership = memberRepository.findByUserIdAndFamilyTreeId(userId, treeId).orElse(null);
        return toDTO(tree, membership != null ? membership.getRole() : null);
    }

    public FamilyTreeDTO getPublicTree(String shareToken) {
        FamilyTree tree = treeRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new RuntimeException("Shared tree not found or link expired"));
        return toDTO(tree, null);
    }

    public List<PersonDTO> getPublicPersons(String shareToken) {
        FamilyTree tree = treeRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new RuntimeException("Shared tree not found or link expired"));
        return personRepository.findByFamilyTreeId(tree.getId()).stream()
                .map(this::toPersonDTO)
                .collect(Collectors.toList());
    }

    private PersonDTO toPersonDTO(Person p) {
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
                .city(p.getCity())
                .generation(p.getGeneration())
                .fatherId(p.getFather() != null ? p.getFather().getId() : null)
                .motherId(p.getMother() != null ? p.getMother().getId() : null)
                .spouseId(p.getSpouse() != null ? p.getSpouse().getId() : null)
                .build();
    }

    public void checkOwnerAccess(UUID userId, UUID treeId) {
        FamilyTreeMember member = memberRepository.findByUserIdAndFamilyTreeId(userId, treeId)
                .orElseThrow(() -> new RuntimeException("Access denied"));
        if (member.getRole() != FamilyTreeMember.Role.OWNER) {
            throw new RuntimeException("Access denied: owner privileges required");
        }
    }

    private FamilyTreeDTO toDTO(FamilyTree tree, FamilyTreeMember.Role role) {
        return FamilyTreeDTO.builder()
                .id(tree.getId())
                .name(tree.getName())
                .description(tree.getDescription())
                .creatorName(tree.getCreator().getDisplayName())
                .memberCount(tree.getMembers().size())
                .personCount(tree.getPersons().size())
                .myRole(role != null ? role.name() : null)
                .shareToken(tree.getShareToken())
                .createdAt(tree.getCreatedAt())
                .build();
    }

    private MemberDTO toMemberDTO(FamilyTreeMember member) {
        return MemberDTO.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .username(member.getUser().getUsername())
                .displayName(member.getUser().getDisplayName())
                .role(member.getRole())
                .linkedPersonId(member.getLinkedPerson() != null ? member.getLinkedPerson().getId() : null)
                .linkedPersonName(member.getLinkedPerson() != null ?
                        member.getLinkedPerson().getFirstName() + " " +
                                (member.getLinkedPerson().getLastName() != null ? member.getLinkedPerson().getLastName() : "")
                        : null)
                .joinedAt(member.getJoinedAt())
                .build();
    }
}
