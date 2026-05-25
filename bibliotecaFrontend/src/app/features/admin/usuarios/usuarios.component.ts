import { Component, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgClass } from '@angular/common'
import { forkJoin } from 'rxjs'
import { ToastService } from '../../../core/services/toast.service'
import { UsuariosApiService } from '../../../core/services/usuarios-api.service'
import { MembrosApiService } from '../../../core/services/membros-api.service'
import { Membro, Usuario } from '../../../core/models/library.models'

interface DirectoryRow {
  kind: 'usuario' | 'membro'
  id: number
  displayId: string
  name: string
  email: string
  roleLabel: string
  status: 'active' | 'inactive'
  initials: string
  color: string
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="grid-2 mb-16" style="align-items:start;">
      <div class="card">
        <div class="card-header">
          <div class="card-icon" style="background:var(--md-primary-container);">
            <span class="material-icons-round" style="color:var(--md-primary)">person_add</span>
          </div>
          <div>
            <div class="card-title">Cadastrar novo perfil</div>
            <div class="card-subtitle">Equipe autenticada ou membro da biblioteca</div>
          </div>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nome</label>
              <input type="text" class="form-input" placeholder="Primeiro nome" [(ngModel)]="newUser.firstName">
            </div>
            <div class="form-group">
              <label class="form-label">Sobrenome</label>
              <input type="text" class="form-input" placeholder="Sobrenome" [(ngModel)]="newUser.lastName">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="input-with-icon">
              <span class="material-icons-round input-icon">email</span>
              <input type="email" class="form-input" placeholder="email@exemplo.com" [(ngModel)]="newUser.email">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Tipo de cadastro</label>
            <select class="form-select" [(ngModel)]="newUser.role">
              <option value="bibliotecario">Bibliotecario(a)</option>
              <option value="admin">Administrador(a)</option>
              <option value="membro">Membro (Leitor)</option>
            </select>
          </div>

          @if (newUser.role !== 'membro') {
            <div class="form-group">
              <label class="form-label">Senha de acesso</label>
              <input type="password" class="form-input" placeholder="Senha temporaria" [(ngModel)]="newUser.password">
            </div>
          } @else {
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Telefone</label>
                <input type="text" class="form-input" placeholder="(91) 99999-9999" [(ngModel)]="newUser.telefone">
              </div>
              <div class="form-group">
                <label class="form-label">Matricula</label>
                <input type="text" class="form-input" placeholder="MAT-001" [(ngModel)]="newUser.matricula">
              </div>
            </div>
          }

          <button class="btn btn-primary w-full" type="button" (click)="registerUser()" [disabled]="saving">
            <span class="material-icons-round">how_to_reg</span>
            {{ saving ? 'Salvando...' : 'Cadastrar perfil' }}
          </button>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        <div class="grid-2" style="gap:12px;">
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon-wrap" style="background:var(--md-primary-container);">
                <span class="material-icons-round" style="color:var(--md-primary)">people</span>
              </div>
            </div>
            <div class="stat-value">{{ totalMembers }}</div>
            <div class="stat-label">Membros da biblioteca</div>
          </div>
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon-wrap" style="background:var(--md-secondary-container);">
                <span class="material-icons-round" style="color:var(--md-secondary)">badge</span>
              </div>
            </div>
            <div class="stat-value">{{ staffCount }}</div>
            <div class="stat-label">Usuarios da equipe</div>
          </div>
        </div>

        <div class="card" style="flex:1;">
          <div class="card-header">
            <div class="card-icon" style="background:var(--md-secondary-container);">
              <span class="material-icons-round" style="color:var(--md-secondary)">group_add</span>
            </div>
            <div>
              <div class="card-title">Perfis recentes</div>
              <div class="card-subtitle">Primeiros registros carregados da API</div>
            </div>
          </div>
          <div class="card-body" style="padding:0;">
            @for (user of recentRows; track user.displayId) {
              <div style="padding:10px 16px; border-bottom:1px solid var(--md-outline-variant); display:flex; align-items:center; gap:10px;">
                <div class="user-avatar-sm" [style.background]="user.color + '20'" [style.color]="user.color">
                  {{ user.initials }}
                </div>
                <div style="flex:1;">
                  <div style="font-size:13px;font-weight:500;">{{ user.name }}</div>
                  <div style="font-size:11px;color:var(--md-on-surface-variant);">{{ user.roleLabel }}</div>
                </div>
                <span class="chip" [ngClass]="user.status === 'active' ? 'chip-active' : 'chip-neutral'" style="font-size:10px;">
                  {{ user.status === 'active' ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-icon" style="background:var(--md-surface-variant);">
          <span class="material-icons-round" style="color:var(--md-on-surface-variant)">manage_accounts</span>
        </div>
        <div>
          <div class="card-title">Diretorio completo</div>
          <div class="card-subtitle">Usuarios autenticados e membros cadastrados</div>
        </div>
      </div>
      <div class="table-wrap" style="border:none;border-radius:0 0 var(--radius-lg) var(--radius-lg);">
        <table>
          <thead>
            <tr>
              <th>Pessoa</th>
              <th>ID</th>
              <th>Perfil</th>
              <th>Status</th>
              <th style="text-align:right;">Acoes</th>
            </tr>
          </thead>
          <tbody>
            @for (user of directoryRows; track user.displayId) {
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div class="user-avatar-sm" [style.background]="user.color + '20'" [style.color]="user.color" style="width:32px;height:32px;font-size:12px;">
                      {{ user.initials }}
                    </div>
                    <div>
                      <div style="font-weight:500;">{{ user.name }}</div>
                      <div style="font-size:11px;color:var(--md-on-surface-variant);">{{ user.email || 'Sem email cadastrado' }}</div>
                    </div>
                  </div>
                </td>
                <td style="font-family:monospace;font-size:12px;">{{ user.displayId }}</td>
                <td><span class="chip chip-info">{{ user.roleLabel }}</span></td>
                <td>
                  <span class="chip" [ngClass]="user.status === 'active' ? 'chip-active' : 'chip-neutral'">
                    {{ user.status === 'active' ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td style="text-align:right;">
                  <button class="btn btn-sm btn-outlined" type="button" (click)="toggleStatus(user)">
                    <span class="material-icons-round">{{ user.status === 'active' ? 'person_off' : 'person' }}</span>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .mb-16 { margin-bottom: 16px; }
    .user-avatar-sm { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; flex-shrink: 0; }
  `]
})
export class UsuariosComponent implements OnInit {
  private readonly toast = inject(ToastService)
  private readonly usuariosApi = inject(UsuariosApiService)
  private readonly membrosApi = inject(MembrosApiService)

  users: Usuario[] = []
  members: Membro[] = []
  directoryRows: DirectoryRow[] = []
  saving = false

  newUser = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'bibliotecario' as 'admin' | 'bibliotecario' | 'membro',
    telefone: '',
    matricula: ''
  }

  ngOnInit(): void {
    this.loadData()
  }

  get totalMembers(): number {
    return this.members.length
  }

  get staffCount(): number {
    return this.users.length
  }

  get recentRows(): DirectoryRow[] {
    return this.directoryRows.slice(0, 4)
  }

  registerUser(): void {
    if (!this.newUser.firstName || !this.newUser.email) {
      this.toast.error('Preencha nome e email para continuar.')
      return
    }

    this.saving = true
    if (this.newUser.role === 'membro') {
      this.membrosApi.create({
        nome: `${this.newUser.firstName} ${this.newUser.lastName}`.trim(),
        email: this.newUser.email,
        telefone: this.newUser.telefone,
        matricula: this.newUser.matricula
      }).subscribe({
        next: () => {
          this.finishSave('Membro cadastrado com sucesso!')
        },
        error: (error) => {
          this.saving = false
          this.toast.error(error?.error?.error || 'Nao foi possivel cadastrar o membro.')
        }
      })
      return
    }

    if (!this.newUser.password) {
      this.saving = false
      this.toast.error('Perfis da equipe precisam de senha para acessar o sistema.')
      return
    }

    this.usuariosApi.create({
      firstName: this.newUser.firstName,
      lastName: this.newUser.lastName,
      email: this.newUser.email,
      password: this.newUser.password,
      role: this.newUser.role
    }).subscribe({
      next: () => {
        this.finishSave('Usuario cadastrado com sucesso!')
      },
      error: (error) => {
        this.saving = false
        this.toast.error(error?.error?.error || 'Nao foi possivel cadastrar o usuario.')
      }
    })
  }

  toggleStatus(row: DirectoryRow): void {
    const request = row.kind === 'usuario'
      ? this.usuariosApi.toggleStatus(row.id)
      : this.membrosApi.toggleStatus(row.id)

    request.subscribe({
      next: () => {
        this.toast.success(`Status de ${row.name} atualizado.`)
        this.loadData()
      },
      error: (error) => {
        this.toast.error(error?.error?.error || 'Nao foi possivel alterar o status.')
      }
    })
  }

  private finishSave(message: string): void {
    this.saving = false
    this.toast.success(message)
    this.newUser = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'bibliotecario',
      telefone: '',
      matricula: ''
    }
    this.loadData()
  }

  private loadData(): void {
    forkJoin({
      users: this.usuariosApi.list(),
      members: this.membrosApi.list()
    }).subscribe({
      next: ({ users, members }) => {
        this.users = users
        this.members = members
        this.directoryRows = [
          ...users.map((user) => this.toUserRow(user)),
          ...members.map((member) => this.toMemberRow(member))
        ]
      },
      error: () => {
        this.toast.error('Nao foi possivel carregar usuarios e membros.')
      }
    })
  }

  private toUserRow(user: Usuario): DirectoryRow {
    return {
      kind: 'usuario',
      id: user.id,
      displayId: `USR-${user.id}`,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      roleLabel: user.role === 'admin' ? 'Administrador(a)' : 'Bibliotecario(a)',
      status: user.status,
      initials: this.getInitials(user.firstName, user.lastName),
      color: this.colorFor(user.id)
    }
  }

  private toMemberRow(member: Membro): DirectoryRow {
    const [firstName = 'Membro', lastName = ''] = member.nome.split(' ')
    return {
      kind: 'membro',
      id: member.id,
      displayId: member.matricula || `MEM-${member.id}`,
      name: member.nome,
      email: member.email || '',
      roleLabel: 'Membro (Leitor)',
      status: member.ativo ? 'active' : 'inactive',
      initials: this.getInitials(firstName, lastName),
      color: this.colorFor(member.id)
    }
  }

  private getInitials(firstName: string, lastName: string): string {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
  }

  private colorFor(id: number): string {
    const colors = ['#1B4F72', '#117A65', '#7D3C98', '#D35400', '#C0392B']
    return colors[id % colors.length]
  }
}
