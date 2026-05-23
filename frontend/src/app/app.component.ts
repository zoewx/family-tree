import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, CommonModule, FormsModule,
    NzLayoutModule, NzMenuModule, NzButtonModule, NzIconModule, NzSpaceModule,
    NzSwitchModule, NzTooltipModule, NzDropDownModule, NzAvatarModule, NzDividerModule
  ],
  template: `
    <nz-layout style="min-height:100vh;">
      <nz-header *ngIf="auth.isLoggedIn"
                 [style.background]="theme.isDark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.85)'"
                 [style.border-bottom]="theme.isDark ? '1px solid #303030' : '1px solid rgba(0,0,0,0.06)'"
                 style="display:flex;align-items:center;justify-content:space-between;padding:0 32px;position:sticky;top:0;z-index:100;line-height:64px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);">

        <!-- Logo: Icon + Text -->
        <a routerLink="/dashboard" style="text-decoration:none;display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(102,126,234,0.3);">
            <span nz-icon nzType="apartment" nzTheme="outline" style="color:#fff;font-size:18px;"></span>
          </div>
          <span class="logo-text" style="font-size:20px;">Family Tree</span>
        </a>

        <!-- Right Actions -->
        <nz-space [nzSize]="12" nzAlign="center">
          <span *nzSpaceItem>
            <button nz-button [nzGhost]="true" nzShape="circle" nzSize="small"
                    nz-tooltip [nzTooltipTitle]="theme.isDark ? 'Light Mode' : 'Dark Mode'"
                    (click)="theme.toggle()"
                    style="border:none;font-size:18px;"
                    [style.color]="theme.isDark ? '#fadb14' : '#666'">
              <span nz-icon [nzType]="theme.isDark ? 'sun' : 'moon'" nzTheme="outline"></span>
            </button>
          </span>
          <span *nzSpaceItem>
            <a nz-dropdown [nzDropdownMenu]="userMenu" style="cursor:pointer;display:flex;align-items:center;gap:8px;text-decoration:none;">
              <nz-avatar nzSize="small" nzIcon="user"
                         style="background:linear-gradient(135deg,#667eea,#764ba2);"></nz-avatar>
              <span [style.color]="theme.isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.65)'"
                    style="font-size:14px;font-weight:500;">
                {{ auth.currentUser?.displayName }}
              </span>
            </a>
            <nz-dropdown-menu #userMenu="nzDropdownMenu">
              <ul nz-menu>
                <li nz-menu-item routerLink="/account">
                  <span nz-icon nzType="setting" nzTheme="outline" style="margin-right:8px;"></span>
                  Account Settings
                </li>
                <li nz-menu-divider></li>
                <li nz-menu-item (click)="auth.logout()">
                  <span nz-icon nzType="logout" nzTheme="outline" style="margin-right:8px;"></span>
                  Sign Out
                </li>
              </ul>
            </nz-dropdown-menu>
          </span>
        </nz-space>
      </nz-header>
      <nz-content style="padding:0;">
        <router-outlet></router-outlet>
      </nz-content>
    </nz-layout>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  constructor(public auth: AuthService, public theme: ThemeService) {}

  ngOnInit(): void {
    this.theme.init();
  }
}
