import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'register',
    component: RegisterComponent,
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
    path: '',
    redirectTo: '/orders',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/orders',
  },
];
