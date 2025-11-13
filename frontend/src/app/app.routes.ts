import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
    canActivate: [authGuard],
  },
  {
    path: 'summary',
    loadComponent: () =>
      import('./components/summary/summary.component').then((m) => m.SummaryComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: '',
    redirectTo: '/orders',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/orders',
  },
];
