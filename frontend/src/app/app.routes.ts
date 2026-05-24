import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tree/:treeId',
    loadComponent: () => import('./pages/tree-view/tree-view.component').then(m => m.TreeViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tree/:treeId/manage',
    loadComponent: () => import('./pages/tree-manage/tree-manage.component').then(m => m.TreeManageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'account',
    loadComponent: () => import('./pages/account/account.component').then(m => m.AccountComponent),
    canActivate: [authGuard]
  },
  {
    path: 'share/:shareToken',
    loadComponent: () => import('./pages/shared-tree/shared-tree.component').then(m => m.SharedTreeComponent)
  },
  {
    path: 'invite/:code',
    loadComponent: () => import('./pages/invite/invite.component').then(m => m.InviteComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
