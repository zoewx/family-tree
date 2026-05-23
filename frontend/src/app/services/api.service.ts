import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FamilyTreeDTO {
  id: string;
  name: string;
  description: string;
  creatorName: string;
  memberCount: number;
  personCount: number;
  myRole: string;
  shareToken: string;
  createdAt: string;
}

export interface PersonDTO {
  id: string;
  firstName: string;
  lastName: string;
  englishName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  deathDate: string;
  photoUrl: string;
  bio: string;
  phone: string;
  email: string;
  country: string;
  province: string;
  city: string;
  generation: number;
  fatherId: string;
  fatherName: string;
  motherId: string;
  motherName: string;
  spouseId: string;
  spouseName: string;
  children: PersonSummary[];
  siblings: PersonSummary[];
  linkedUserId: string;
  galleryPhotos: PhotoItem[];
}

export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
}

export interface LinkRequestDTO {
  id: string;
  personId: string;
  personName: string;
  requesterId: string;
  requesterName: string;
  status: string;
  createdAt: string;
}

export interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string;
  englishName: string;
  gender: 'MALE' | 'FEMALE';
  photoUrl: string;
}

export interface MemberDTO {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  linkedPersonId: string;
  linkedPersonName: string;
  joinedAt: string;
}

export interface UserProfileDTO {
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
}

export interface InvitationDTO {
  id: string;
  code: string;
  familyTreeId: string;
  familyTreeName: string;
  invitedByName: string;
  inviteeEmail: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // Family Trees
  createTree(data: {
    name: string;
    description?: string;
  }): Observable<FamilyTreeDTO> {
    return this.http.post<FamilyTreeDTO>(`${this.baseUrl}/trees`, data);
  }

  getMyTrees(): Observable<FamilyTreeDTO[]> {
    return this.http.get<FamilyTreeDTO[]>(`${this.baseUrl}/trees`);
  }

  getTree(treeId: string): Observable<FamilyTreeDTO> {
    return this.http.get<FamilyTreeDTO>(`${this.baseUrl}/trees/${treeId}`);
  }

  updateTree(
    treeId: string,
    data: { name: string; description?: string },
  ): Observable<FamilyTreeDTO> {
    return this.http.put<FamilyTreeDTO>(
      `${this.baseUrl}/trees/${treeId}`,
      data,
    );
  }

  deleteTree(treeId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/trees/${treeId}`);
  }

  // Persons
  getPersons(treeId: string): Observable<PersonDTO[]> {
    return this.http.get<PersonDTO[]>(
      `${this.baseUrl}/trees/${treeId}/persons`,
    );
  }

  getPerson(treeId: string, personId: string): Observable<PersonDTO> {
    return this.http.get<PersonDTO>(
      `${this.baseUrl}/trees/${treeId}/persons/${personId}`,
    );
  }

  createPerson(treeId: string, data: any): Observable<PersonDTO> {
    return this.http.post<PersonDTO>(
      `${this.baseUrl}/trees/${treeId}/persons`,
      data,
    );
  }

  updatePerson(
    treeId: string,
    personId: string,
    data: any,
  ): Observable<PersonDTO> {
    return this.http.put<PersonDTO>(
      `${this.baseUrl}/trees/${treeId}/persons/${personId}`,
      data,
    );
  }

  deletePerson(treeId: string, personId: string, cascade = false): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/trees/${treeId}/persons/${personId}?cascade=${cascade}`,
    );
  }

  uploadPhoto(
    treeId: string,
    personId: string,
    file: File,
  ): Observable<PersonDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PersonDTO>(
      `${this.baseUrl}/trees/${treeId}/persons/${personId}/photo`,
      formData,
    );
  }

  linkUserToPerson(treeId: string, personId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/trees/${treeId}/persons/${personId}/link`,
      {},
    );
  }

  // Members
  getMembers(treeId: string): Observable<MemberDTO[]> {
    return this.http.get<MemberDTO[]>(
      `${this.baseUrl}/trees/${treeId}/members`,
    );
  }

  updateMemberRole(
    treeId: string,
    memberId: string,
    role: string,
  ): Observable<MemberDTO> {
    return this.http.put<MemberDTO>(
      `${this.baseUrl}/trees/${treeId}/members/${memberId}/role`,
      { role },
    );
  }

  removeMember(treeId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/trees/${treeId}/members/${memberId}`,
    );
  }

  // Import
  importExcel(treeId: string, file: File): Observable<{ imported: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imported: number }>(
      `${this.baseUrl}/trees/${treeId}/import`,
      formData,
    );
  }

  // Invitations
  createInvitation(treeId: string, email: string): Observable<InvitationDTO> {
    return this.http.post<InvitationDTO>(
      `${this.baseUrl}/trees/${treeId}/invitations`,
      { email },
    );
  }

  getTreeInvitations(treeId: string): Observable<InvitationDTO[]> {
    return this.http.get<InvitationDTO[]>(
      `${this.baseUrl}/trees/${treeId}/invitations`,
    );
  }

  validateInvitation(code: string): Observable<InvitationDTO> {
    return this.http.get<InvitationDTO>(
      `${this.baseUrl}/invitations/validate/${code}`,
    );
  }

  acceptInvitation(code: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/invitations/${code}/accept`,
      {},
    );
  }

  cancelInvitation(invitationId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/invitations/${invitationId}`,
    );
  }

  // User Account
  getProfile(): Observable<UserProfileDTO> {
    return this.http.get<UserProfileDTO>(`${this.baseUrl}/user/me`);
  }

  updateProfile(data: { displayName: string }): Observable<UserProfileDTO> {
    return this.http.put<UserProfileDTO>(`${this.baseUrl}/user/profile`, data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/user/password`, data);
  }

  changeEmail(data: { newEmail: string; password: string }): Observable<UserProfileDTO> {
    return this.http.put<UserProfileDTO>(`${this.baseUrl}/user/email`, data);
  }

  // Share
  generateShareToken(treeId: string): Observable<FamilyTreeDTO> {
    return this.http.post<FamilyTreeDTO>(`${this.baseUrl}/trees/${treeId}/share`, {});
  }

  revokeShareToken(treeId: string): Observable<FamilyTreeDTO> {
    return this.http.delete<FamilyTreeDTO>(`${this.baseUrl}/trees/${treeId}/share`);
  }

  // Public
  getSharedTree(shareToken: string): Observable<FamilyTreeDTO> {
    return this.http.get<FamilyTreeDTO>(`${this.baseUrl}/public/share/${shareToken}`);
  }

  getSharedPersons(shareToken: string): Observable<PersonDTO[]> {
    return this.http.get<PersonDTO[]>(`${this.baseUrl}/public/share/${shareToken}/persons`);
  }

  getSharedGallery(shareToken: string, personId: string): Observable<PhotoItem[]> {
    return this.http.get<PhotoItem[]>(`${this.baseUrl}/public/share/${shareToken}/persons/${personId}/gallery`);
  }

  // Gallery
  uploadGalleryPhoto(treeId: string, personId: string, file: File): Observable<PersonDTO> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<PersonDTO>(`${this.baseUrl}/trees/${treeId}/persons/${personId}/gallery`, fd);
  }

  deleteGalleryPhoto(treeId: string, personId: string, photoId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/trees/${treeId}/persons/${personId}/gallery/${photoId}`);
  }

  // Link requests
  requestLink(treeId: string, personId: string): Observable<LinkRequestDTO> {
    return this.http.post<LinkRequestDTO>(`${this.baseUrl}/trees/${treeId}/persons/${personId}/link-request`, {});
  }

  getLinkRequests(treeId: string): Observable<LinkRequestDTO[]> {
    return this.http.get<LinkRequestDTO[]>(`${this.baseUrl}/trees/${treeId}/link-requests`);
  }

  approveLinkRequest(treeId: string, requestId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/trees/${treeId}/link-requests/${requestId}/approve`, {});
  }

  rejectLinkRequest(treeId: string, requestId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/trees/${treeId}/link-requests/${requestId}/reject`, {});
  }
}
