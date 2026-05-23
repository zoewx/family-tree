import 'dart:io';
import 'package:dio/dio.dart';
import '../models/models.dart';

class ApiService {
  final Dio _dio;

  ApiService(this._dio);

  // Family Trees
  Future<List<FamilyTreeDTO>> getMyTrees() async {
    final res = await _dio.get('/api/trees');
    return (res.data as List).map((e) => FamilyTreeDTO.fromJson(e)).toList();
  }

  Future<FamilyTreeDTO> getTree(String treeId) async {
    final res = await _dio.get('/api/trees/$treeId');
    return FamilyTreeDTO.fromJson(res.data);
  }

  Future<FamilyTreeDTO> createTree(String name, String? description) async {
    final res = await _dio.post('/api/trees', data: {
      'name': name,
      if (description != null) 'description': description,
    });
    return FamilyTreeDTO.fromJson(res.data);
  }

  Future<FamilyTreeDTO> updateTree(
      String treeId, String name, String? description) async {
    final res = await _dio.put('/api/trees/$treeId', data: {
      'name': name,
      if (description != null) 'description': description,
    });
    return FamilyTreeDTO.fromJson(res.data);
  }

  Future<void> deleteTree(String treeId) async {
    await _dio.delete('/api/trees/$treeId');
  }

  // Persons
  Future<List<PersonDTO>> getPersons(String treeId) async {
    final res = await _dio.get('/api/trees/$treeId/persons');
    return (res.data as List).map((e) => PersonDTO.fromJson(e)).toList();
  }

  Future<PersonDTO> getPerson(String treeId, String personId) async {
    final res = await _dio.get('/api/trees/$treeId/persons/$personId');
    return PersonDTO.fromJson(res.data);
  }

  Future<PersonDTO> createPerson(
      String treeId, Map<String, dynamic> data) async {
    final res = await _dio.post('/api/trees/$treeId/persons', data: data);
    return PersonDTO.fromJson(res.data);
  }

  Future<PersonDTO> updatePerson(
      String treeId, String personId, Map<String, dynamic> data) async {
    final res =
        await _dio.put('/api/trees/$treeId/persons/$personId', data: data);
    return PersonDTO.fromJson(res.data);
  }

  Future<void> deletePerson(String treeId, String personId,
      {bool cascade = false}) async {
    await _dio
        .delete('/api/trees/$treeId/persons/$personId?cascade=$cascade');
  }

  Future<PersonDTO> uploadPhoto(
      String treeId, String personId, File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path),
    });
    final res = await _dio
        .post('/api/trees/$treeId/persons/$personId/photo', data: formData);
    return PersonDTO.fromJson(res.data);
  }

  Future<void> linkUserToPerson(String treeId, String personId) async {
    await _dio.post('/api/trees/$treeId/persons/$personId/link', data: {});
  }

  // Gallery
  Future<PersonDTO> uploadGalleryPhoto(
      String treeId, String personId, File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path),
    });
    final res = await _dio
        .post('/api/trees/$treeId/persons/$personId/gallery', data: formData);
    return PersonDTO.fromJson(res.data);
  }

  Future<void> deleteGalleryPhoto(
      String treeId, String personId, String photoId) async {
    await _dio
        .delete('/api/trees/$treeId/persons/$personId/gallery/$photoId');
  }

  // Members
  Future<List<MemberDTO>> getMembers(String treeId) async {
    final res = await _dio.get('/api/trees/$treeId/members');
    return (res.data as List).map((e) => MemberDTO.fromJson(e)).toList();
  }

  Future<MemberDTO> updateMemberRole(
      String treeId, String memberId, String role) async {
    final res = await _dio
        .put('/api/trees/$treeId/members/$memberId/role', data: {'role': role});
    return MemberDTO.fromJson(res.data);
  }

  Future<void> removeMember(String treeId, String memberId) async {
    await _dio.delete('/api/trees/$treeId/members/$memberId');
  }

  // Import
  Future<int> importExcel(String treeId, File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path),
    });
    final res =
        await _dio.post('/api/trees/$treeId/import', data: formData);
    return res.data['imported'] ?? 0;
  }

  // Invitations
  Future<InvitationDTO> createInvitation(String treeId, String email) async {
    final res = await _dio
        .post('/api/trees/$treeId/invitations', data: {'email': email});
    return InvitationDTO.fromJson(res.data);
  }

  Future<List<InvitationDTO>> getTreeInvitations(String treeId) async {
    final res = await _dio.get('/api/trees/$treeId/invitations');
    return (res.data as List).map((e) => InvitationDTO.fromJson(e)).toList();
  }

  Future<InvitationDTO> validateInvitation(String code) async {
    final res = await _dio.get('/api/invitations/validate/$code');
    return InvitationDTO.fromJson(res.data);
  }

  Future<void> acceptInvitation(String code) async {
    await _dio.post('/api/invitations/$code/accept', data: {});
  }

  Future<void> cancelInvitation(String invitationId) async {
    await _dio.delete('/api/invitations/$invitationId');
  }

  // User Account
  Future<UserProfileDTO> getProfile() async {
    final res = await _dio.get('/api/user/me');
    return UserProfileDTO.fromJson(res.data);
  }

  Future<UserProfileDTO> updateProfile(String displayName) async {
    final res = await _dio
        .put('/api/user/profile', data: {'displayName': displayName});
    return UserProfileDTO.fromJson(res.data);
  }

  Future<void> changePassword(
      String currentPassword, String newPassword) async {
    await _dio.put('/api/user/password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<UserProfileDTO> changeEmail(String newEmail, String password) async {
    final res = await _dio.put('/api/user/email', data: {
      'newEmail': newEmail,
      'password': password,
    });
    return UserProfileDTO.fromJson(res.data);
  }

  // Share
  Future<FamilyTreeDTO> generateShareToken(String treeId) async {
    final res = await _dio.post('/api/trees/$treeId/share', data: {});
    return FamilyTreeDTO.fromJson(res.data);
  }

  Future<FamilyTreeDTO> revokeShareToken(String treeId) async {
    final res = await _dio.delete('/api/trees/$treeId/share');
    return FamilyTreeDTO.fromJson(res.data);
  }

  Future<FamilyTreeDTO> getSharedTree(String shareToken) async {
    final res = await _dio.get('/api/public/share/$shareToken');
    return FamilyTreeDTO.fromJson(res.data);
  }

  Future<List<PersonDTO>> getSharedPersons(String shareToken) async {
    final res = await _dio.get('/api/public/share/$shareToken/persons');
    return (res.data as List).map((e) => PersonDTO.fromJson(e)).toList();
  }

  // Link requests
  Future<LinkRequestDTO> requestLink(String treeId, String personId) async {
    final res = await _dio.post(
        '/api/trees/$treeId/persons/$personId/link-request',
        data: {});
    return LinkRequestDTO.fromJson(res.data);
  }

  Future<List<LinkRequestDTO>> getLinkRequests(String treeId) async {
    final res = await _dio.get('/api/trees/$treeId/link-requests');
    return (res.data as List).map((e) => LinkRequestDTO.fromJson(e)).toList();
  }

  Future<void> approveLinkRequest(String treeId, String requestId) async {
    await _dio.post('/api/trees/$treeId/link-requests/$requestId/approve',
        data: {});
  }

  Future<void> rejectLinkRequest(String treeId, String requestId) async {
    await _dio.post('/api/trees/$treeId/link-requests/$requestId/reject',
        data: {});
  }
}
