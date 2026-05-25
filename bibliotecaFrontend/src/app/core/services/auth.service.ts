import { Injectable, computed, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { tap } from 'rxjs/operators'
import { LoginResponse, AuthUser, UserRole } from '../models/library.models'

interface StoredSession {
  token: string
  usuario: AuthUser
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient)
  private readonly router = inject(Router)
  private readonly storageKey = 'bibliotheca.session'

  readonly currentUser = signal<AuthUser | null>(null)
  readonly token = signal<string | null>(null)
  readonly isAuthenticated = computed(() => !!this.currentUser() && !!this.token())

  constructor() {
    this.restoreSession()
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap((response) => this.setSession(response.token, response.usuario))
    )
  }

  setSession(token: string, usuario: AuthUser): void {
    this.token.set(token)
    this.currentUser.set(usuario)
    if (typeof localStorage !== 'undefined') {
      const payload: StoredSession = { token, usuario }
      localStorage.setItem(this.storageKey, JSON.stringify(payload))
    }
  }

  logout(redirectToLogin = true): void {
    this.token.set(null)
    this.currentUser.set(null)
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey)
    }
    if (redirectToLogin) {
      void this.router.navigateByUrl('/login')
    }
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUser()
    return !!user && roles.includes(user.role)
  }

  dashboardForRole(role: UserRole): string {
    if (role === 'admin') {
      return '/admin/inventario'
    }
    if (role === 'bibliotecario') {
      return '/bibliotecario/emprestimo'
    }
    return '/login'
  }

  navigateToDashboard(): void {
    const user = this.currentUser()
    if (user) {
      void this.router.navigateByUrl(this.dashboardForRole(user.role))
    }
  }

  private restoreSession(): void {
    if (typeof localStorage === 'undefined') {
      return
    }

    const rawSession = localStorage.getItem(this.storageKey)
    if (!rawSession) {
      return
    }

    try {
      const session = JSON.parse(rawSession) as StoredSession
      if (session?.token && session?.usuario) {
        this.token.set(session.token)
        this.currentUser.set(session.usuario)
      }
    } catch {
      localStorage.removeItem(this.storageKey)
    }
  }
}
