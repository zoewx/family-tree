import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, InvitationDTO } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzSpaceModule } from 'ng-zorro-antd/space';

@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [CommonModule, RouterLink, NzCardModule, NzButtonModule, NzResultModule, NzSpinModule, NzTypographyModule, NzSpaceModule],
  template: `
    <div class="center-page">
      <div style="width:100%;max-width:420px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:48px;margin-bottom:12px;">✉️</div>
          <h2 nz-typography>Family Tree Invitation</h2>
        </div>

        <!-- Loading -->
        <nz-card *ngIf="loading" style="text-align:center;">
          <nz-spin nzSimple></nz-spin>
          <p nz-typography nzType="secondary" style="margin-top:12px;">Validating invitation...</p>
        </nz-card>

        <!-- Error -->
        <nz-card *ngIf="error">
          <nz-result nzStatus="error" [nzTitle]="error">
            <div nz-result-extra>
              <button nz-button nzType="primary" routerLink="/dashboard">Go to Dashboard</button>
            </div>
          </nz-result>
        </nz-card>

        <!-- Valid Invitation -->
        <nz-card *ngIf="invitation && !loading && !error" style="text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">🌳</div>
          <h3 nz-typography>{{ invitation.familyTreeName }}</h3>
          <p nz-typography nzType="secondary" style="margin-bottom:24px;">
            Invited by {{ invitation.invitedByName }}
          </p>

          <div *ngIf="auth.isLoggedIn">
            <button nz-button nzType="primary" (click)="accept()" [nzLoading]="accepting">
              Accept & Join
            </button>
          </div>

          <div *ngIf="!auth.isLoggedIn">
            <p nz-typography nzType="secondary" style="margin-bottom:12px;">Sign in or create an account to join</p>
            <nz-space nzDirection="vertical" style="width:100%;">
              <button *nzSpaceItem nz-button nzType="primary" nzBlock [routerLink]="['/login']">Sign In</button>
              <button *nzSpaceItem nz-button nzBlock [routerLink]="['/register']" [queryParams]="{invite: code}">
                Create Account
              </button>
            </nz-space>
          </div>
        </nz-card>
      </div>
    </div>
  `
})
export class InviteComponent implements OnInit {
  code = '';
  invitation: InvitationDTO | null = null;
  loading = true;
  error = '';
  accepting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') || '';
    this.api.validateInvitation(this.code).subscribe({
      next: (inv) => {
        this.invitation = inv;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid or expired invitation';
        this.loading = false;
      }
    });
  }

  accept(): void {
    this.accepting = true;
    this.api.acceptInvitation(this.code).subscribe({
      next: () => this.router.navigate(['/tree', this.invitation?.familyTreeId]),
      error: (err) => {
        this.error = err.error?.message || 'Failed to accept invitation';
        this.accepting = false;
      }
    });
  }
}
