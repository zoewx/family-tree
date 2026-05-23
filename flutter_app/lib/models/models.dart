class FamilyTreeDTO {
  final String id;
  final String name;
  final String description;
  final String creatorName;
  final int memberCount;
  final int personCount;
  final String myRole;
  final String? shareToken;
  final String createdAt;

  FamilyTreeDTO({
    required this.id,
    required this.name,
    this.description = '',
    this.creatorName = '',
    this.memberCount = 0,
    this.personCount = 0,
    this.myRole = '',
    this.shareToken,
    this.createdAt = '',
  });

  factory FamilyTreeDTO.fromJson(Map<String, dynamic> json) => FamilyTreeDTO(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        description: json['description'] ?? '',
        creatorName: json['creatorName'] ?? '',
        memberCount: json['memberCount'] ?? 0,
        personCount: json['personCount'] ?? 0,
        myRole: json['myRole'] ?? '',
        shareToken: json['shareToken'],
        createdAt: json['createdAt'] ?? '',
      );
}

class PersonDTO {
  final String id;
  final String firstName;
  final String lastName;
  final String englishName;
  final String gender;
  final String? birthDate;
  final String? deathDate;
  final String? photoUrl;
  final String? bio;
  final String? phone;
  final String? email;
  final String? country;
  final String? province;
  final String? city;
  final int generation;
  final String? fatherId;
  final String? fatherName;
  final String? motherId;
  final String? motherName;
  final String? spouseId;
  final String? spouseName;
  final String? linkedUserId;
  final List<PersonSummary> children;
  final List<PersonSummary> siblings;
  final List<PhotoItem> galleryPhotos;

  PersonDTO({
    required this.id,
    required this.firstName,
    this.lastName = '',
    this.englishName = '',
    this.gender = 'MALE',
    this.birthDate,
    this.deathDate,
    this.photoUrl,
    this.bio,
    this.phone,
    this.email,
    this.country,
    this.province,
    this.city,
    this.generation = 0,
    this.fatherId,
    this.fatherName,
    this.motherId,
    this.motherName,
    this.spouseId,
    this.spouseName,
    this.linkedUserId,
    this.children = const [],
    this.siblings = const [],
    this.galleryPhotos = const [],
  });

  String get displayName {
    final cn = '${lastName}${firstName}'.trim();
    return cn.isNotEmpty ? cn : englishName;
  }

  factory PersonDTO.fromJson(Map<String, dynamic> json) => PersonDTO(
        id: json['id'] ?? '',
        firstName: json['firstName'] ?? '',
        lastName: json['lastName'] ?? '',
        englishName: json['englishName'] ?? '',
        gender: json['gender'] ?? 'MALE',
        birthDate: json['birthDate'],
        deathDate: json['deathDate'],
        photoUrl: json['photoUrl'],
        bio: json['bio'],
        phone: json['phone'],
        email: json['email'],
        country: json['country'],
        province: json['province'],
        city: json['city'],
        generation: json['generation'] ?? 0,
        fatherId: json['fatherId'],
        fatherName: json['fatherName'],
        motherId: json['motherId'],
        motherName: json['motherName'],
        spouseId: json['spouseId'],
        spouseName: json['spouseName'],
        linkedUserId: json['linkedUserId'],
        children: (json['children'] as List?)
                ?.map((e) => PersonSummary.fromJson(e))
                .toList() ??
            [],
        siblings: (json['siblings'] as List?)
                ?.map((e) => PersonSummary.fromJson(e))
                .toList() ??
            [],
        galleryPhotos: (json['galleryPhotos'] as List?)
                ?.map((e) => PhotoItem.fromJson(e))
                .toList() ??
            [],
      );
}

class PersonSummary {
  final String id;
  final String firstName;
  final String lastName;
  final String englishName;
  final String gender;
  final String? photoUrl;

  PersonSummary({
    required this.id,
    this.firstName = '',
    this.lastName = '',
    this.englishName = '',
    this.gender = 'MALE',
    this.photoUrl,
  });

  String get displayName {
    final cn = '${lastName}${firstName}'.trim();
    return cn.isNotEmpty ? cn : englishName;
  }

  factory PersonSummary.fromJson(Map<String, dynamic> json) => PersonSummary(
        id: json['id'] ?? '',
        firstName: json['firstName'] ?? '',
        lastName: json['lastName'] ?? '',
        englishName: json['englishName'] ?? '',
        gender: json['gender'] ?? 'MALE',
        photoUrl: json['photoUrl'],
      );
}

class PhotoItem {
  final String id;
  final String url;
  final String? caption;

  PhotoItem({required this.id, required this.url, this.caption});

  factory PhotoItem.fromJson(Map<String, dynamic> json) => PhotoItem(
        id: json['id'] ?? '',
        url: json['url'] ?? '',
        caption: json['caption'],
      );
}

class MemberDTO {
  final String id;
  final String userId;
  final String username;
  final String displayName;
  final String role;
  final String? linkedPersonId;
  final String? linkedPersonName;
  final String joinedAt;

  MemberDTO({
    required this.id,
    this.userId = '',
    this.username = '',
    this.displayName = '',
    this.role = 'MEMBER',
    this.linkedPersonId,
    this.linkedPersonName,
    this.joinedAt = '',
  });

  factory MemberDTO.fromJson(Map<String, dynamic> json) => MemberDTO(
        id: json['id'] ?? '',
        userId: json['userId'] ?? '',
        username: json['username'] ?? '',
        displayName: json['displayName'] ?? '',
        role: json['role'] ?? 'MEMBER',
        linkedPersonId: json['linkedPersonId'],
        linkedPersonName: json['linkedPersonName'],
        joinedAt: json['joinedAt'] ?? '',
      );
}

class InvitationDTO {
  final String id;
  final String code;
  final String familyTreeId;
  final String familyTreeName;
  final String invitedByName;
  final String? inviteeEmail;
  final String status;
  final String createdAt;
  final String? expiresAt;

  InvitationDTO({
    required this.id,
    this.code = '',
    this.familyTreeId = '',
    this.familyTreeName = '',
    this.invitedByName = '',
    this.inviteeEmail,
    this.status = '',
    this.createdAt = '',
    this.expiresAt,
  });

  factory InvitationDTO.fromJson(Map<String, dynamic> json) => InvitationDTO(
        id: json['id'] ?? '',
        code: json['code'] ?? '',
        familyTreeId: json['familyTreeId'] ?? '',
        familyTreeName: json['familyTreeName'] ?? '',
        invitedByName: json['invitedByName'] ?? '',
        inviteeEmail: json['inviteeEmail'],
        status: json['status'] ?? '',
        createdAt: json['createdAt'] ?? '',
        expiresAt: json['expiresAt'],
      );
}

class LinkRequestDTO {
  final String id;
  final String personId;
  final String personName;
  final String requesterId;
  final String requesterName;
  final String status;
  final String createdAt;

  LinkRequestDTO({
    required this.id,
    this.personId = '',
    this.personName = '',
    this.requesterId = '',
    this.requesterName = '',
    this.status = '',
    this.createdAt = '',
  });

  factory LinkRequestDTO.fromJson(Map<String, dynamic> json) => LinkRequestDTO(
        id: json['id'] ?? '',
        personId: json['personId'] ?? '',
        personName: json['personName'] ?? '',
        requesterId: json['requesterId'] ?? '',
        requesterName: json['requesterName'] ?? '',
        status: json['status'] ?? '',
        createdAt: json['createdAt'] ?? '',
      );
}

class UserProfileDTO {
  final String username;
  final String email;
  final String displayName;
  final String? avatarUrl;
  final String createdAt;

  UserProfileDTO({
    this.username = '',
    this.email = '',
    this.displayName = '',
    this.avatarUrl,
    this.createdAt = '',
  });

  factory UserProfileDTO.fromJson(Map<String, dynamic> json) => UserProfileDTO(
        username: json['username'] ?? '',
        email: json['email'] ?? '',
        displayName: json['displayName'] ?? '',
        avatarUrl: json['avatarUrl'],
        createdAt: json['createdAt'] ?? '',
      );
}
