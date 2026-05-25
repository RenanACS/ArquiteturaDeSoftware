import { Routes } from '@angular/router'
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guards'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Login - Bibliotheca'
  },
  {
    path: 'bibliotecario',
    canActivate: [authGuard, roleGuard(['admin', 'bibliotecario'])],
    loadComponent: () =>
      import('./layout/bibliotecario-layout/bibliotecario-layout.component')
        .then((m) => m.BibliotecarioLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'emprestimo',
        pathMatch: 'full'
      },
      {
        path: 'emprestimo',
        loadComponent: () =>
          import('./features/bibliotecario/emprestimo/emprestimo.component')
            .then((m) => m.EmprestimoComponent),
        title: 'Registro de Emprestimo - Bibliotheca'
      },
      {
        path: 'devolucoes',
        loadComponent: () =>
          import('./features/bibliotecario/devolucoes/devolucoes.component')
            .then((m) => m.DevolucoesComponent),
        title: 'Devolucoes - Bibliotheca'
      },
      {
        path: 'salas',
        loadComponent: () =>
          import('./features/bibliotecario/salas/salas.component')
            .then((m) => m.SalasComponent),
        title: 'Reservas de Salas - Bibliotheca'
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout.component')
        .then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'inventario',
        pathMatch: 'full'
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./features/admin/inventario/inventario.component')
            .then((m) => m.InventarioComponent),
        title: 'Inventario - Bibliotheca'
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/usuarios/usuarios.component')
            .then((m) => m.UsuariosComponent),
        title: 'Equipe e Membros - Bibliotheca'
      },
      {
        path: 'relatorios',
        loadComponent: () =>
          import('./features/admin/relatorios/relatorios.component')
            .then((m) => m.RelatoriosComponent),
        title: 'Relatorios - Bibliotheca'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
]
