import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, UserProfileDTO } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    NzCardModule, NzButtonModule, NzInputModule, NzFormModule,
    NzAlertModule, NzTypographyModule, NzDividerModule,
    NzDescriptionsModule, NzSpinModule, NzGridModule, NzAvatarModule, NzIconModule
  ],
  template: `
    <div class="page-container-sm">
      <div class="page-header" style="display:flex;align-items:center;gap:12px;">
        <button nz-button routerLink="/dashboard">
          <span nz-icon nzType="arrow-left" nzTheme="outline"></span> Back
        </button>
        <h2 style="display:flex;align-items:center;gap:10px;">
          <span nz-icon nzType="setting" nzTheme="outline" style="color:var(--brand-color);font-size:24px;"></span>
          Account Settings
        </h2>
      </div>

      <nz-spin [nzSpinning]="loading">
        <div nz-row [nzGutter]="[0, 20]" *ngIf="profile">

          <!-- Profile Info -->
          <div nz-col [nzSpan]="24" class="fade-in-up">
            <nz-card [nzTitle]="profileTitle">
              <ng-template #profileTitle>
                <span class="section-title">
                  <span nz-icon nzType="idcard" nzTheme="outline"></span> Profile Information
                </span>
              </ng-template>
              <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px;">
                <nz-avatar nzSize="large" nzIcon="user"
                           style="background:linear-gradient(135deg,#667eea,#764ba2);width:64px;height:64px;line-height:64px;font-size:28px;"></nz-avatar>
                <div>
                  <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;">{{ profile.displayName }}</div>
                  <div style="opacity:0.45;font-size:13px;">@{{ profile.username }}</div>
                </div>
              </div>
              <nz-descriptions [nzColumn]="1" nzBordered nzSize="small">
                <nz-descriptions-item nzTitle="Username">
                  <span nz-icon nzType="user" nzTheme="outline" style="margin-right:6px;opacity:0.4;"></span>
                  {{ profile.username }}
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="Email">
                  <span nz-icon nzType="mail" nzTheme="outline" style="margin-right:6px;opacity:0.4;"></span>
                  {{ profile.email }}
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="Member Since">
                  <span nz-icon nzType="calendar" nzTheme="outline" style="margin-right:6px;opacity:0.4;"></span>
                  {{ profile.createdAt | date:'yyyy-MM-dd' }}
                </nz-descriptions-item>
              </nz-descriptions>
            </nz-card>
          </div>

          <!-- Update Display Name -->
          <div nz-col [nzSpan]="24" class="fade-in-up" style="animation-delay:0.05s;">
            <nz-card [nzTitle]="displayTitle">
              <ng-template #displayTitle>
                <span class="section-title">
                  <span nz-icon nzType="edit" nzTheme="outline"></span> Display Name
                </span>
              </ng-template>
              <nz-form-item>
                <nz-form-label style="font-weight:500;">New Display Name</nz-form-label>
                <nz-form-control>
                  <nz-input-group nzPrefixIcon="user" nzSize="large">
                    <input nz-input [(ngModel)]="displayName" placeholder="Display name">
                  </nz-input-group>
                </nz-form-control>
              </nz-form-item>
              <button nz-button nzType="primary" [nzLoading]="savingProfile" (click)="updateProfile()"
                      [disabled]="!displayName.trim()" style="font-weight:600;">
                <span nz-icon nzType="save" nzTheme="outline"></span> Save
              </button>
              <nz-alert *ngIf="profileMsg" [nzType]="profileMsgType" [nzMessage]="profileMsg"
                        nzShowIcon nzCloseable style="margin-top:12px;"
                        (nzOnClose)="profileMsg=''"></nz-alert>
            </nz-card>
          </div>

          <!-- Change Password -->
          <div nz-col [nzSpan]="24" class="fade-in-up" style="animation-delay:0.1s;">
            <nz-card [nzTitle]="passwordTitle">
              <ng-template #passwordTitle>
                <span class="section-title">
                  <span nz-icon nzType="lock" nzTheme="outline"></span> Change Password
                </span>
              </ng-template>
              <nz-form-item>
                <nz-form-label style="font-weight:500;">Current Password</nz-form-label>
                <nz-form-control>
                  <nz-input-group nzPrefixIcon="key" nzSize="large">
                    <input nz-input type="password" [(ngModel)]="currentPassword" placeholder="Current password">
                  </nz-input-group>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label style="font-weight:500;">New Password</nz-form-label>
                <nz-form-control>
                  <nz-input-group nzPrefixIcon="lock" nzSize="large">
                    <input nz-input type="password" [(ngModel)]="newPassword" placeholder="New password (min 6 chars)">
                  </nz-input-group>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label style="font-weight:500;">Confirm New Password</nz-form-label>
                <nz-form-control>
                  <nz-input-group nzPrefixIcon="lock" nzSize="large">
                    <input nz-input type="password" [(ngModel)]="confirmPassword" placeholder="Confirm new password">
                  </nz-input-group>
                </nz-form-control>
              </nz-form-item>
              <button nz-button nzType="primary" nzDanger [nzLoading]="savingPassword" (click)="changePassword()"
                      [disabled]="!currentPassword || !newPassword || newPassword.length < 6"
                      style="font-weight:600;">
                <span nz-icon nzType="safety" nzTheme="outline"></span> Change Password
              </button>
              <nz-alert *ngIf="passwordMsg" [nzType]="passwordMsgType" [nzMessage]="passwordMsg"
                        nzShowIcon nzCloseable style="margin-top:12px;"
                        (nzOnClose)="passwordMsg=''"></nz-alert>
            </nz-card>
          </div>

          <!-- Change Email -->
          <div nz-col [nzSpan]="24" class="fade-in-up" style="animation-delay:0.15s;">
            <nz-card [nzTitle]="emailTitle">
              <ng-template #emailTitle>
                <span class="section-title">
                  <span nz-icon nzType="mail" nzTheme="outline"></span> Change Email
                </span>
              </ng-template>
              <nz-form-item>
                <nz-form-label style="font-weight:500;">New Email</nz-form-label>
                <nz-form-control>
                  <nz-input-group nzPrefixIcon="mail" nzSize="large">
                    <input nz-input type="email" [(ngModel)]="newEmail" placeholder="new@email.com">
                  </nz-input-group>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label style="font-weight:500;">Confirm Password</nz-form-label>
                <nz-form-control>
                  <nz-input-group nzPrefixIcon="lock" nzSize="large">
                    <input nz-input type="password" [(ngModel)]="emailPassword" placeholder="Your current password">
                  </nz-input-group>
                </nz-form-control>
              </nz-form-item>
              <button nz-button nzType="primary" [nzLoading]="savingEmail" (click)="changeEmail()"
                      [disabled]="!newEmail || !emailPassword" style="font-weight:600;">
                <span nz-icon nzType="save" nzTheme="outline"></span> Change Email
              </button>
              <nz-alert *ngIf="emailMsg" [nzType]="emailMsgType" [nzMessage]="emailMsg"
                        nzShowIcon nzCloseable style="margin-top:12px;"
                        (nzOnClose)="emailMsg=''"></nz-alert>
            </nz-card>
          </div>

        </div>
      </nz-spin>
    </div>
  `
})
export class AccountComponent implements OnInit {
  profile: UserProfileDTO | null = null;
  loading = true;

  displayName = '';
  savingProfile = false;
  profileMsg = '';
  profileMsgType: 'success' | 'error' = 'success';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  savingPassword = false;
  passwordMsg = '';
  passwordMsgType: 'success' | 'error' = 'success';

  newEmail = '';
  emailPassword = '';
  savingEmail = false;
  emailMsg = '';
  emailMsgType: 'success' | 'error' = 'success';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.api.getProfile().subscribe({
      next: (p) => {
        this.profile = p;
        this.displayName = p.displayName || '';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  updateProfile(): void {
    this.savingProfile = true;
    this.api.updateProfile({ displayName: this.displayName.trim() }).subscribe({
      next: (p) => {
        this.profile = p;
        this.profileMsg = 'Display name updated';
        this.profileMsgType = 'success';
        this.savingProfile = false;
        this.syncAuthDisplayName(p.displayName);
      },
      error: (err) => {
        this.profileMsg = err.error?.message || 'Failed to update';
        this.profileMsgType = 'error';
        this.savingProfile = false;
      }
    });
  }

  changePassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.passwordMsg = 'New passwords do not match';
      this.passwordMsgType = 'error';
      return;
    }
    this.savingPassword = true;
    this.api.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.passwordMsg = 'Password changed successfully';
        this.passwordMsgType = 'success';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.savingPassword = false;
      },
      error: (err) => {
        this.passwordMsg = err.error?.message || 'Failed to change password';
        this.passwordMsgType = 'error';
        this.savingPassword = false;
      }
    });
  }

  changeEmail(): void {
    this.savingEmail = true;
    this.api.changeEmail({
      newEmail: this.newEmail,
      password: this.emailPassword
    }).subscribe({
      next: (p) => {
        this.profile = p;
        this.emailMsg = 'Email changed successfully';
        this.emailMsgType = 'success';
        this.newEmail = '';
        this.emailPassword = '';
        this.savingEmail = false;
      },
      error: (err) => {
        this.emailMsg = err.error?.message || 'Failed to change email';
        this.emailMsgType = 'error';
        this.savingEmail = false;
      }
    });
  }

  private syncAuthDisplayName(name: string): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        user.displayName = name;
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch {}
    }
  }
}
