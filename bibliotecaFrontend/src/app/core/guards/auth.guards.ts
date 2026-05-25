import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from '../services/auth.service'
import { UserRole } from '../models/library.models'

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService)
  const router = inject(Router)

  if (authService.isAuthenticated()) {
    return true
  }

  return router.createUrlTree(['/login'])
}

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService)
  const user = authService.currentUser()

  if (!user) {
    return true
  }

  return inject(Router).createUrlTree([authService.dashboardForRole(user.role)])
}

export function roleGuard(roles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService)
    const router = inject(Router)
    const user = authService.currentUser()

    if (!user) {
      return router.createUrlTree(['/login'])
    }

    if (roles.includes(user.role)) {
      return true
    }

    return router.createUrlTree([authService.dashboardForRole(user.role)])
  }
}
