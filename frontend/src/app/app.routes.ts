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
    path: 'users',
    loadComponent: () =>
      import('./pages/users/users.component').then((m) => m.UsersComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'ingredientes',
    loadComponent: () =>
      import('./pages/ingredientes/ingredientes.component').then((m) => m.IngredientesComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'payments',
    loadComponent: () =>
      import('./pages/payments/payments.component').then((m) => m.PaymentsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'estadisticas',
    loadComponent: () =>
      import('./pages/estadisticas/estadisticas.component').then((m) => m.EstadisticasComponent),
    canActivate: [authGuard],
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
