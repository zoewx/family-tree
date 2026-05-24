import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, FamilyTreeDTO } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NzCardModule, NzButtonModule, NzEmptyModule, NzModalModule, NzInputModule, NzFormModule, NzTagModule, NzGridModule, NzTypographyModule, NzSpinModule, NzIconModule],
  template: `
    <div class="page-container">
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div>
          <h2 style="display:flex;align-items:center;gap:10px;">
            <span nz-icon nzType="appstore" nzTheme="outline" style="color:var(--brand-color);font-size:28px;"></span>
            My Family Trees
          </h2>
          <p>Manage and explore your family connections</p>
        </div>
        <div style="display:flex;gap:12px;align-items:center;">
          <a *ngIf="isAdmin" routerLink="/admin">
            <button nz-button nzSize="large" style="height:42px;font-weight:600;">
              <span nz-icon nzType="team" nzTheme="outline"></span>
              Manage Users
            </button>
          </a>
          <button nz-button nzType="primary" nzSize="large" (click)="showCreateModal = true"
                  style="height:42px;font-weight:600;">
            <span nz-icon nzType="plus" nzTheme="outline"></span>
            New Tree
          </button>
        </div>
      </div>

      <nz-spin [nzSpinning]="loading">
        <!-- Empty State -->
        <nz-card *ngIf="trees.length === 0 && !loading" style="text-align:center;padding:60px 0;">
          <div style="margin-bottom:20px;">
            <div class="logo-icon" style="margin:0 auto 16px;">
              <span nz-icon nzType="apartment" nzTheme="outline" style="font-size:28px;"></span>
            </div>
          </div>
          <nz-empty nzNotFoundContent="No family trees yet"
                    [nzNotFoundFooter]="emptyFooter">
          </nz-empty>
          <ng-template #emptyFooter>
            <button nz-button nzType="primary" nzSize="large" (click)="showCreateModal = true"
                    style="margin-top:8px;font-weight:600;">
              <span nz-icon nzType="plus" nzTheme="outline"></span>
              Create Your First Family Tree
            </button>
          </ng-template>
        </nz-card>

        <!-- Tree Grid -->
        <div nz-row [nzGutter]="[20, 20]">
          <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="8" *ngFor="let tree of trees; let i = index">
            <nz-card [nzHoverable]="true" (click)="openTree(tree.id)"
                     style="cursor:pointer;height:100%;" class="fade-in-up"
                     [style.animation-delay]="i * 0.05 + 's'">
              <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:16px;">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(102,126,234,0.25);">
                  <span nz-icon nzType="apartment" nzTheme="outline" style="color:#fff;font-size:20px;"></span>
                </div>
                <nz-tag [nzColor]="getRoleColor(tree.myRole)" style="margin:0;">
                  <span nz-icon [nzType]="getRoleIcon(tree.myRole)" nzTheme="outline" style="margin-right:4px;"></span>
                  {{ tree.myRole }}
                </nz-tag>
              </div>
              <h4 style="font-size:17px;font-weight:600;margin-bottom:4px;letter-spacing:-0.02em;">{{ tree.name }}</h4>
              <p *ngIf="tree.description" style="font-size:13px;opacity:0.5;margin-bottom:0;line-height:1.5;">
                {{ tree.description }}
              </p>
              <div style="margin-top:16px;display:flex;gap:16px;">
                <span class="stat-item">
                  <span nz-icon nzType="user" nzTheme="outline"></span>
                  {{ tree.personCount }} people
                </span>
                <span class="stat-item">
                  <span nz-icon nzType="team" nzTheme="outline"></span>
                  {{ tree.memberCount }} members
                </span>
              </div>
              <div style="margin-top:8px;font-size:12px;opacity:0.35;">
                <span nz-icon nzType="crown" nzTheme="outline" style="margin-right:4px;"></span>
                {{ tree.creatorName }}
              </div>
            </nz-card>
          </div>
        </div>
      </nz-spin>

      <!-- Create Modal -->
      <nz-modal [(nzVisible)]="showCreateModal" nzTitle="Create New Family Tree"
                (nzOnCancel)="showCreateModal = false" (nzOnOk)="createTree()"
                nzOkText="Create" [nzOkDisabled]="!newTreeName.trim()">
        <ng-container *nzModalContent>
          <nz-form-item>
            <nz-form-label style="font-weight:500;">
              <span nz-icon nzType="edit" nzTheme="outline" style="margin-right:4px;"></span> Name
            </nz-form-label>
            <nz-form-control>
              <input nz-input nzSize="large" [(ngModel)]="newTreeName" placeholder="e.g. The Smith Family">
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label style="font-weight:500;">
              <span nz-icon nzType="profile" nzTheme="outline" style="margin-right:4px;"></span> Description
            </nz-form-label>
            <nz-form-control>
              <textarea nz-input [(ngModel)]="newTreeDescription" [nzAutosize]="{ minRows: 3 }"
                        placeholder="Optional description"></textarea>
            </nz-form-control>
          </nz-form-item>
        </ng-container>
      </nz-modal>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  trees: FamilyTreeDTO[] = [];
  loading = true;
  showCreateModal = false;
  newTreeName = '';
  newTreeDescription = '';
  isAdmin = false;

  constructor(private api: ApiService, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.currentUser?.role === 'ADMIN';
    this.loadTrees();
  }

  loadTrees(): void {
    this.loading = true;
    this.api.getMyTrees().subscribe({
      next: (trees) => {
        this.trees = trees;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  createTree(): void {
    if (!this.newTreeName.trim()) return;
    this.api.createTree({ name: this.newTreeName, description: this.newTreeDescription }).subscribe({
      next: (tree) => {
        this.showCreateModal = false;
        this.newTreeName = '';
        this.newTreeDescription = '';
        this.router.navigate(['/tree', tree.id]);
      }
    });
  }

  openTree(treeId: string): void {
    this.router.navigate(['/tree', treeId]);
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'OWNER': return 'gold';
      case 'ADMIN': return 'purple';
      default: return 'default';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'OWNER': return 'crown';
      case 'ADMIN': return 'safety';
      default: return 'user';
    }
  }
}
