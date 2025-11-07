import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UserService } from '../services/user.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  // Esperar a que se cargue el usuario de IndexedDB
  const user = await userService.getUser();

  if (user) {
    return true;
  } else {
    router.navigate(['/register']);
    return false;
  }
};
