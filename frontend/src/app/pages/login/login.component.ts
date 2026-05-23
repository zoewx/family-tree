import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-login',
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
          <p style="font-size:15px;opacity:0.5;font-weight:400;">Sign in to explore your family connections</p>
        </div>

        <div class="glass-card" style="padding:36px 32px;">
          <nz-alert *ngIf="error" nzType="error" [nzMessage]="error" nzShowIcon style="margin-bottom:20px;"></nz-alert>

          <nz-form-item>
            <nz-form-label style="font-weight:500;">Username</nz-form-label>
            <nz-form-control>
              <nz-input-group nzPrefixIcon="user" nzSize="large">
                <input nz-input [(ngModel)]="username" placeholder="Enter your username" (keydown.enter)="login()">
              </nz-input-group>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label style="font-weight:500;">Password</nz-form-label>
            <nz-form-control>
              <nz-input-group nzPrefixIcon="lock" nzSize="large">
                <input nz-input [(ngModel)]="password" type="password" placeholder="Enter your password" (keydown.enter)="login()">
              </nz-input-group>
            </nz-form-control>
          </nz-form-item>

          <button nz-button nzType="primary" nzBlock nzSize="large" [nzLoading]="loading" (click)="login()"
                  style="margin-top:8px;height:44px;font-size:15px;font-weight:600;">
            <span nz-icon nzType="lock" nzTheme="outline" *ngIf="!loading"></span>
            Sign In
          </button>

          <div style="text-align:center;margin-top:24px;font-size:14px;">
            <span style="opacity:0.5;">Don't have an account? </span>
            <a routerLink="/register" style="font-weight:600;">Create Account</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {
    if (authService.isLoggedIn) {
      router.navigate(['/dashboard']);
    }
  }

  login(): void {
    if (!this.username || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err.error?.message || 'Invalid credentials';
        this.loading = false;
      }
    });
  }
}
