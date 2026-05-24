import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  createdAt: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, NzTableModule, NzButtonModule, NzTagModule, NzAlertModule, NzIconModule, NzPopconfirmModule, NzSpinModule],
  template: `
    <div style="min-height:100vh;background:var(--bg-primary);padding:32px 24px;">
      <div style="max-width:900px;margin:0 auto;">

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
          <div>
            <h1 style="margin:0;font-size:24px;font-weight:700;">User Management</h1>
            <p style="margin:4px 0 0;opacity:0.5;">Approve or reject pending user registrations</p>
          </div>
          <a routerLink="/dashboard">
            <button nz-button>
              <span nz-icon nzType="arrow-left"></span> Back to Dashboard
            </button>
          </a>
        </div>

        <nz-alert *ngIf="error" nzType="error" [nzMessage]="error" nzShowIcon style="margin-bottom:20px;"></nz-alert>
        <nz-alert *ngIf="successMsg" nzType="success" [nzMessage]="successMsg" nzShowIcon style="margin-bottom:20px;"></nz-alert>

        <div class="glass-card" style="padding:0;overflow:hidden;">
          <nz-spin [nzSpinning]="loading">
            <nz-table
              #table
              [nzData]="users"
              [nzBordered]="false"
              [nzShowPagination]="users.length > 10"
              nzSize="middle">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Display Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of table.data">
                  <td><strong>{{ user.username }}</strong></td>
                  <td>{{ user.displayName }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <nz-tag [nzColor]="statusColor(user.status)">{{ user.status }}</nz-tag>
                  </td>
                  <td>{{ formatDate(user.createdAt) }}</td>
                  <td>
                    <button
                      *ngIf="user.status !== 'ACTIVE'"
                      nz-button nzType="primary" nzSize="small"
                      nz-popconfirm nzPopconfirmTitle="Approve this user?"
                      (nzOnConfirm)="approve(user)"
                      style="margin-right:8px;">
                      <span nz-icon nzType="check"></span> Approve
                    </button>
                    <button
                      *ngIf="user.status !== 'REJECTED'"
                      nz-button nzDanger nzSize="small"
                      nz-popconfirm nzPopconfirmTitle="Reject this user?"
                      (nzOnConfirm)="reject(user)">
                      <span nz-icon nzType="close"></span> Reject
                    </button>
                  </td>
                </tr>
              </tbody>
            </nz-table>
          </nz-spin>
        </div>

      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  users: AdminUser[] = [];
  loading = false;
  error = '';
  successMsg = '';
  private apiUrl = environment.apiUrl + '/admin';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.currentUser?.role !== 'ADMIN') {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.http.get<AdminUser[]>(`${this.apiUrl}/users`).subscribe({
      next: (users) => {
        this.users = users.sort((a, b) => {
          const order = { PENDING: 0, ACTIVE: 1, REJECTED: 2 };
          return order[a.status] - order[b.status];
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  approve(user: AdminUser): void {
    this.http.post(`${this.apiUrl}/users/${user.id}/approve`, {}).subscribe({
      next: () => {
        user.status = 'ACTIVE';
        this.successMsg = `${user.username} has been approved`;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => this.error = 'Failed to approve user'
    });
  }

  reject(user: AdminUser): void {
    this.http.post(`${this.apiUrl}/users/${user.id}/reject`, {}).subscribe({
      next: () => {
        user.status = 'REJECTED';
        this.successMsg = `${user.username} has been rejected`;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => this.error = 'Failed to reject user'
    });
  }

  statusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'REJECTED': return 'red';
      default: return 'orange';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  }
}
