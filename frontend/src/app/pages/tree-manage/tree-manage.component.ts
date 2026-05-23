import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, FamilyTreeDTO, MemberDTO, InvitationDTO, LinkRequestDTO } from '../../services/api.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDividerModule } from 'ng-zorro-antd/divider';

@Component({
  selector: 'app-tree-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NzCardModule, NzButtonModule, NzInputModule, NzFormModule, NzTagModule, NzListModule, NzSelectModule, NzAlertModule, NzTypographyModule, NzAvatarModule, NzPopconfirmModule, NzSpaceModule, NzEmptyModule, NzDividerModule],
  template: `
    <div class="page-container-sm">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        <button nz-button [routerLink]="['/tree', treeId]">← Back to Tree</button>
        <div>
          <h3 nz-typography style="margin:0;">Manage: {{ tree?.name }}</h3>
          <span nz-typography nzType="secondary">Members, permissions, and invitations</span>
        </div>
      </div>

      <!-- Tree Settings -->
      <nz-card nzTitle="Tree Settings" style="margin-bottom:16px;" *ngIf="isOwner">
        <nz-form-item>
          <nz-form-label>Name</nz-form-label>
          <nz-form-control>
            <input nz-input [(ngModel)]="editName">
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label>Description</nz-form-label>
          <nz-form-control>
            <textarea nz-input [(ngModel)]="editDescription" [nzAutosize]="{ minRows: 3 }"></textarea>
          </nz-form-control>
        </nz-form-item>
        <div style="display:flex;justify-content:space-between;margin-top:12px;">
          <button nz-button nzType="primary" (click)="updateTree()">Save Changes</button>
          <button nz-button nzDanger nz-popconfirm nzPopconfirmTitle="Permanently delete this tree?"
                  (nzOnConfirm)="doDelete()">Delete Tree</button>
        </div>
      </nz-card>

      <!-- Members -->
      <nz-card [nzTitle]="'Members (' + members.length + ')'" style="margin-bottom:16px;">
        <nz-list nzSize="small">
          <nz-list-item *ngFor="let member of members">
            <nz-list-item-meta
              nzAvatar="👤"
              [nzTitle]="memberTitle"
              [nzDescription]="member.linkedPersonName ? 'Linked to: ' + member.linkedPersonName : ''">
            </nz-list-item-meta>
            <ng-template #memberTitle>
              {{ member.displayName || member.username }}
              <span nz-typography nzType="secondary" style="margin-left:8px;font-size:12px;">&#64;{{ member.username }}</span>
            </ng-template>
            <ul nz-list-item-actions>
              <nz-list-item-action *ngIf="isOwner && member.role !== 'OWNER'">
                <nz-select [ngModel]="member.role" (ngModelChange)="changeRole(member, $event)" nzSize="small" style="width:100px;">
                  <nz-option nzValue="ADMIN" nzLabel="Admin"></nz-option>
                  <nz-option nzValue="MEMBER" nzLabel="Member"></nz-option>
                </nz-select>
              </nz-list-item-action>
              <nz-list-item-action *ngIf="member.role === 'OWNER'">
                <nz-tag nzColor="gold">Owner</nz-tag>
              </nz-list-item-action>
              <nz-list-item-action *ngIf="isOwner && member.role !== 'OWNER'">
                <a nz-typography nzType="danger" (click)="removeMember(member)">Remove</a>
              </nz-list-item-action>
            </ul>
          </nz-list-item>
        </nz-list>
      </nz-card>

      <!-- Link Requests -->
      <nz-card *ngIf="isOwner && linkRequests.length > 0" [nzTitle]="linkReqTitle" style="margin-bottom:16px;">
        <ng-template #linkReqTitle>
          Link Requests ({{ linkRequests.length }})
        </ng-template>
        <nz-list nzSize="small">
          <nz-list-item *ngFor="let req of linkRequests">
            <nz-list-item-meta
              nzAvatar="🔗"
              [nzTitle]="req.requesterName"
              [nzDescription]="'Wants to link to: ' + req.personName">
            </nz-list-item-meta>
            <ul nz-list-item-actions>
              <nz-list-item-action>
                <button nz-button nzType="primary" nzSize="small" (click)="approveLink(req)">Approve</button>
              </nz-list-item-action>
              <nz-list-item-action>
                <button nz-button nzDanger nzSize="small" (click)="rejectLink(req)">Reject</button>
              </nz-list-item-action>
            </ul>
          </nz-list-item>
        </nz-list>
      </nz-card>

      <!-- Invitations -->
      <nz-card nzTitle="Invitations">
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <input nz-input [(ngModel)]="inviteEmail" placeholder="Enter email to invite" style="flex:1;">
          <button nz-button nzType="primary" (click)="createInvitation()" [disabled]="!inviteEmail.trim()">
            Send Invite
          </button>
        </div>

        <nz-alert *ngIf="lastInviteCode" nzType="success" nzShowIcon
                  [nzMessage]="'Invitation created!'"
                  [nzDescription]="inviteLinkTpl" style="margin-bottom:16px;">
        </nz-alert>
        <ng-template #inviteLinkTpl>
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
            <input nz-input [value]="getInviteLink(lastInviteCode)" readonly style="flex:1;">
            <button nz-button nzSize="small" (click)="copyLink()">📋 Copy</button>
          </div>
        </ng-template>

        <nz-list nzSize="small">
          <nz-list-item *ngFor="let inv of invitations">
            <nz-list-item-meta
              [nzTitle]="inv.inviteeEmail"
              [nzDescription]="'Code: ' + inv.code + ' · Invited by ' + inv.invitedByName">
            </nz-list-item-meta>
            <ul nz-list-item-actions>
              <nz-list-item-action>
                <nz-tag [nzColor]="getInviteStatusColor(inv.status)">{{ inv.status }}</nz-tag>
              </nz-list-item-action>
              <nz-list-item-action *ngIf="inv.status === 'PENDING'">
                <a nz-typography nzType="danger" (click)="cancelInvitation(inv)">Cancel</a>
              </nz-list-item-action>
            </ul>
          </nz-list-item>
          <nz-empty *ngIf="invitations.length === 0" nzNotFoundContent="No invitations yet"></nz-empty>
        </nz-list>
      </nz-card>
    </div>
  `
})
export class TreeManageComponent implements OnInit {
  treeId = '';
  tree: FamilyTreeDTO | null = null;
  members: MemberDTO[] = [];
  invitations: InvitationDTO[] = [];
  linkRequests: LinkRequestDTO[] = [];
  isOwner = false;
  editName = '';
  editDescription = '';
  inviteEmail = '';
  lastInviteCode = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.treeId = this.route.snapshot.paramMap.get('treeId') || '';
    this.loadAll();
  }

  loadAll(): void {
    this.api.getTree(this.treeId).subscribe({
      next: (tree) => {
        this.tree = tree;
        this.isOwner = tree.myRole === 'OWNER';
        this.editName = tree.name;
        this.editDescription = tree.description || '';
        this.loadLinkRequests();
      }
    });
    this.api.getMembers(this.treeId).subscribe({
      next: (members) => this.members = members
    });
    this.api.getTreeInvitations(this.treeId).subscribe({
      next: (invs) => this.invitations = invs,
      error: () => {}
    });
  }

  loadLinkRequests(): void {
    if (!this.isOwner) return;
    this.api.getLinkRequests(this.treeId).subscribe({
      next: (reqs) => this.linkRequests = reqs,
      error: () => {}
    });
  }

  updateTree(): void {
    this.api.updateTree(this.treeId, { name: this.editName, description: this.editDescription }).subscribe({
      next: (tree) => this.tree = tree
    });
  }

  doDelete(): void {
    this.api.deleteTree(this.treeId).subscribe({
      next: () => this.router.navigate(['/dashboard'])
    });
  }

  changeRole(member: MemberDTO, newRole: string): void {
    this.api.updateMemberRole(this.treeId, member.id, newRole).subscribe({
      next: (updated) => {
        const idx = this.members.findIndex(m => m.id === member.id);
        if (idx >= 0) this.members[idx] = updated;
      }
    });
  }

  removeMember(member: MemberDTO): void {
    if (confirm(`Remove ${member.displayName || member.username} from this tree?`)) {
      this.api.removeMember(this.treeId, member.id).subscribe({
        next: () => this.members = this.members.filter(m => m.id !== member.id)
      });
    }
  }

  createInvitation(): void {
    if (!this.inviteEmail.trim()) return;
    this.api.createInvitation(this.treeId, this.inviteEmail).subscribe({
      next: (inv) => {
        this.lastInviteCode = inv.code;
        this.invitations.unshift(inv);
        this.inviteEmail = '';
      }
    });
  }

  cancelInvitation(inv: InvitationDTO): void {
    this.api.cancelInvitation(inv.id).subscribe({
      next: () => {
        inv.status = 'CANCELLED';
      }
    });
  }

  getInviteLink(code: string): string {
    return `${window.location.origin}/invite/${code}`;
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.getInviteLink(this.lastInviteCode));
  }

  approveLink(req: LinkRequestDTO): void {
    this.api.approveLinkRequest(this.treeId, req.id).subscribe({
      next: () => this.linkRequests = this.linkRequests.filter(r => r.id !== req.id)
    });
  }

  rejectLink(req: LinkRequestDTO): void {
    this.api.rejectLinkRequest(this.treeId, req.id).subscribe({
      next: () => this.linkRequests = this.linkRequests.filter(r => r.id !== req.id)
    });
  }

  getInviteStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'ACCEPTED': return 'green';
      case 'EXPIRED': return 'default';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  }
}
