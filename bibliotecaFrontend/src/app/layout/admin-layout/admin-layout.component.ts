import { Component, computed, inject, signal } from '@angular/core'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { AuthService } from '../../core/services/auth.service'

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="sidebar-overlay" [class.open]="sidebarOpen()" (click)="sidebarOpen.set(false)"></div>

    <aside class="sidebar" [class.open]="sidebarOpen()">
      <div class="sidebar-logo">
        <a class="logo-mark" routerLink="/admin/inventario">
          <div class="logo-icon"><span class="material-icons-round">auto_stories</span></div>
          <div>
            <div class="logo-text">Bibliotheca</div>
            <div class="logo-sub">Administracao</div>
          </div>
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-label">Gestao</div>
        <a class="nav-item" routerLink="/admin/inventario" routerLinkActive="active" (click)="sidebarOpen.set(false)">
          <span class="material-icons-round">inventory_2</span>
          Inventario
        </a>
        <a class="nav-item" routerLink="/admin/usuarios" routerLinkActive="active" (click)="sidebarOpen.set(false)">
          <span class="material-icons-round">manage_accounts</span>
          Equipe e Membros
        </a>
        <a class="nav-item" routerLink="/admin/relatorios" routerLinkActive="active" (click)="sidebarOpen.set(false)">
          <span class="material-icons-round">bar_chart</span>
          Relatorios
        </a>
      </div>

      <div class="sidebar-divider"></div>

      <div class="sidebar-section">
        <div class="sidebar-section-label">Circulacao</div>
        <a class="nav-item" routerLink="/bibliotecario/emprestimo" (click)="sidebarOpen.set(false)">
          <span class="material-icons-round">library_add</span>
          Painel do Balcao
        </a>
      </div>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar" style="background:rgba(255,255,255,0.15); color:white;">{{ initials() }}</div>
          <div class="user-info">
            <div class="user-name">{{ fullName() }}</div>
            <div class="user-role">Administrador(a)</div>
          </div>
        </div>
        <button class="btn btn-tonal logout-btn" type="button" (click)="logout()">
          <span class="material-icons-round">logout</span>
          Sair
        </button>
      </div>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <button class="icon-btn menu-btn" (click)="sidebarOpen.set(!sidebarOpen())">
          <span class="material-icons-round">menu</span>
        </button>
        <div>
          <div class="topbar-title">Bibliotheca</div>
          <div class="topbar-subtitle">Painel do Administrador</div>
        </div>
        <div class="topbar-spacer"></div>
        <div class="topbar-user">
          <span class="material-icons-round">verified_user</span>
          {{ fullName() }}
        </div>
      </header>

      <div class="content-area">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; height: 100vh; overflow: hidden; width: 100%; }
    .sidebar { width: var(--sidebar-width); background: var(--md-primary); display: flex; flex-direction: column; flex-shrink: 0; position: relative; z-index: 10; transition: transform 0.3s ease; }
    .sidebar::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 60%); pointer-events: none; }
    .sidebar-logo { padding: 20px 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .logo-mark { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-icon { width: 38px; height: 38px; background: rgba(255,255,255,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; }
    .logo-text { font-family: 'DM Serif Display', serif; color: white; font-size: 20px; letter-spacing: -0.3px; }
    .logo-sub { font-size: 10px; color: rgba(255,255,255,0.5); letter-spacing: 1.2px; text-transform: uppercase; margin-top: -2px; }
    .sidebar-section { padding: 16px 12px 8px; }
    .sidebar-section-label { font-size: 10px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: rgba(255,255,255,0.4); padding: 0 8px; margin-bottom: 4px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius-md); cursor: pointer; transition: var(--transition); color: rgba(255,255,255,0.7); font-size: 13.5px; font-weight: 400; position: relative; margin-bottom: 2px; text-decoration: none; }
    .nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
    .nav-item.active { background: rgba(255,255,255,0.15); color: white; font-weight: 500; }
    .nav-item.active::before { content: ''; position: absolute; left: 0; top: 20%; bottom: 20%; width: 3px; background: #5DADE2; border-radius: 0 3px 3px 0; }
    .nav-item .material-icons-round { font-size: 20px; flex-shrink: 0; }
    .sidebar-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 8px 12px; }
    .sidebar-footer { margin-top: auto; padding: 12px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 10px; }
    .user-card { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: var(--radius-md); }
    .user-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; flex-shrink: 0; }
    .user-info { flex: 1; overflow: hidden; }
    .user-name { color: white; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { color: rgba(255,255,255,0.45); font-size: 11px; }
    .logout-btn { width: 100%; }
    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .topbar { height: var(--topbar-height); background: var(--md-surface-container); border-bottom: 1px solid var(--md-outline-variant); display: flex; align-items: center; padding: 0 24px; gap: 16px; flex-shrink: 0; }
    .topbar-title { font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--md-on-surface); letter-spacing: -0.3px; }
    .topbar-subtitle { font-size: 12px; color: var(--md-on-surface-variant); margin-top: 1px; }
    .topbar-spacer { flex: 1; }
    .topbar-user { display: inline-flex; align-items: center; gap: 8px; color: var(--md-on-surface-variant); font-size: 13px; }
    .topbar-user .material-icons-round { font-size: 18px; }
    .content-area { flex: 1; overflow-y: auto; padding: 24px; }
    .menu-btn { display: none; }
    .sidebar-overlay { display: none; }
    @media (max-width: 768px) {
      .sidebar { position: fixed; top: 0; left: 0; bottom: 0; transform: translateX(-100%); z-index: 50; width: 260px; }
      .sidebar.open { transform: translateX(0); }
      .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 40; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
      .sidebar-overlay.open { opacity: 1; pointer-events: all; }
      .menu-btn { display: flex; }
      .topbar { padding: 0 16px; }
      .content-area { padding: 16px; }
      .topbar-user { display: none; }
    }
  `]
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService)
  readonly sidebarOpen = signal(false)

  fullName = computed(() => {
    const user = this.authService.currentUser()
    return user ? `${user.firstName} ${user.lastName}` : 'Administrador'
  })

  initials = computed(() => {
    const user = this.authService.currentUser()
    if (!user) {
      return 'A'
    }
    return `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase()
  })

  logout(): void {
    this.authService.logout()
  }
}
