import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NzCardModule, NzInputModule, NzButtonModule, NzAlertModule, NzFormModule, NzTypographyModule, NzIconModule],
  template: `
    <div class="center-page auth-bg">
      <div style="width:100%;max-width:420px;position:relative;z-index:1;" class="fade-in-up">
        <!-- Logo -->
        <div style="text-align:center;margin-bottom:36px;">
          <div class="logo-icon">
            <span nz-icon nzType="apartment" nzTheme="outline" style="font-size:28px;"></span>
          </div>
          <div class="logo-text" style="font-size:30px;margin-bottom:6px;">Family Tree</div>
          <p style="font-size:15px;opacity:0.5;font-weight:400;">Create your account to get started</p>
        </div>

        <div class="glass-card" style="padding:36px 32px;">
          <nz-alert *ngIf="error" nzType="error" [nzMessage]="error" nzShowIcon style="margin-bottom:20px;"></nz-alert>
          <nz-alert *ngIf="successMessage" nzType="success" [nzMessage]="successMessage" nzShowIcon style="margin-bottom:20px;"></nz-alert>

          <nz-form-item>
            <nz-form-label style="font-weight:500;">Username</nz-form-label>
            <nz-form-control>
              <nz-input-group nzPrefixIcon="user" nzSize="large">
                <input nz-input [(ngModel)]="username" placeholder="Choose a username">
              </nz-input-group>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label style="font-weight:500;">Display Name</nz-form-label>
            <nz-form-control>
              <nz-input-group nzPrefixIcon="idcard" nzSize="large">
                <input nz-input [(ngModel)]="displayName" placeholder="Your display name">
              </nz-input-group>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label style="font-weight:500;">Email</nz-form-label>
            <nz-form-control>
              <nz-input-group nzPrefixIcon="mail" nzSize="large">
                <input nz-input [(ngModel)]="email" type="email" placeholder="your@email.com">
              </nz-input-group>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label style="font-weight:500;">Password</nz-form-label>
            <nz-form-control>
              <nz-input-group nzPrefixIcon="lock" nzSize="large">
                <input nz-input [(ngModel)]="password" type="password" placeholder="At least 6 characters">
              </nz-input-group>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item *ngIf="invitationCode">
            <nz-form-label style="font-weight:500;">Invitation Code</nz-form-label>
            <nz-form-control>
              <nz-input-group nzPrefixIcon="share-alt" nzSize="large">
                <input nz-input [(ngModel)]="invitationCode" readonly>
              </nz-input-group>
            </nz-form-control>
          </nz-form-item>

          <button nz-button nzType="primary" nzBlock nzSize="large" [nzLoading]="loading" [disabled]="!!successMessage" (click)="register()"
                  style="margin-top:8px;height:44px;font-size:15px;font-weight:600;">
            <span nz-icon nzType="user" nzTheme="outline" *ngIf="!loading"></span>
            Create Account
          </button>

          <div style="text-align:center;margin-top:24px;font-size:14px;">
            <span style="opacity:0.5;">Already have an account? </span>
            <a routerLink="/login" style="font-weight:600;">Sign In</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  username = '';
  displayName = '';
  email = '';
  password = '';
  invitationCode = '';
  error = '';
  loading = false;
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['invite']) {
        this.invitationCode = params['invite'];
      }
    });
  }

  register(): void {
    if (!this.username || !this.email || !this.password) {
      this.error = 'Please fill in all required fields';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authService.register({
      username: this.username,
      email: this.email,
      password: this.password,
      displayName: this.displayName || this.username,
      invitationCode: this.invitationCode || undefined
    }).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Registration successful. Please wait for admin approval.';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
        this.loading = false;
      }
    });
  }
}
