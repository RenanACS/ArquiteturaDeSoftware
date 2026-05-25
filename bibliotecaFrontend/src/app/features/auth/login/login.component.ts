import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AuthService } from '../../../core/services/auth.service'
import { ToastService } from '../../../core/services/toast.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-panel">
        <div class="login-brand">
          <div class="brand-mark">
            <span class="material-icons-round">auto_stories</span>
          </div>
          <div>
            <div class="brand-title">Bibliotheca</div>
            <div class="brand-subtitle">Acesso ao sistema da biblioteca</div>
          </div>
        </div>

        <div class="login-card">
          <div class="card-header">
            <div class="card-icon" style="background:var(--md-primary-container);">
              <span class="material-icons-round" style="color:var(--md-primary)">lock</span>
            </div>
            <div>
              <div class="card-title">Entrar</div>
              <div class="card-subtitle">Use um usuario do back-end para acessar os paineis</div>
            </div>
          </div>

          <div class="card-body">
            <div class="helper-box">
              <div class="helper-title">Conta inicial disponivel</div>
              <div class="helper-line"><strong>Email:</strong> admin&#64;biblioteca.com</div>
              <div class="helper-line"><strong>Senha:</strong> admin123</div>
            </div>

            <div class="form-group">
              <label class="form-label">Email</label>
              <div class="input-with-icon">
                <span class="material-icons-round input-icon">mail</span>
                <input
                  type="email"
                  class="form-input"
                  placeholder="admin@biblioteca.com"
                  [(ngModel)]="email"
                  [disabled]="loading"
                >
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Senha</label>
              <div class="input-with-icon">
                <span class="material-icons-round input-icon">password</span>
                <input
                  type="password"
                  class="form-input"
                  placeholder="Sua senha"
                  [(ngModel)]="password"
                  [disabled]="loading"
                  (keyup.enter)="submit()"
                >
              </div>
            </div>

            <div class="login-actions">
              <button class="btn btn-tonal" type="button" (click)="fillAdmin()" [disabled]="loading">
                Preencher admin
              </button>
              <button class="btn btn-primary" type="button" (click)="submit()" [disabled]="loading">
                <span class="material-icons-round">login</span>
                {{ loading ? 'Entrando...' : 'Entrar no sistema' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
    }

    .login-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background:
        radial-gradient(circle at top left, rgba(17, 122, 101, 0.15), transparent 28%),
        radial-gradient(circle at bottom right, rgba(27, 79, 114, 0.18), transparent 32%),
        linear-gradient(135deg, #f4f8fb 0%, #eef4f7 100%);
    }

    .login-panel {
      width: min(100%, 460px);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .login-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 4px;
    }

    .brand-mark {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--md-primary);
      color: white;
      box-shadow: var(--shadow-md);
    }

    .brand-title {
      font-family: 'DM Serif Display', serif;
      font-size: 32px;
      color: var(--md-primary);
      line-height: 1;
    }

    .brand-subtitle {
      margin-top: 4px;
      color: var(--md-on-surface-variant);
      font-size: 13px;
    }

    .login-card {
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.75);
      border-radius: 24px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      backdrop-filter: blur(10px);
    }

    .helper-box {
      background: var(--md-surface-variant);
      border: 1px solid var(--md-outline-variant);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      margin-bottom: 16px;
    }

    .helper-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: var(--md-on-surface-variant);
      margin-bottom: 8px;
    }

    .helper-line {
      font-size: 13px;
      color: var(--md-on-surface);
    }

    .helper-line + .helper-line {
      margin-top: 4px;
    }

    .login-actions {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-top: 8px;
    }

    .login-actions .btn {
      flex: 1;
    }

    @media (max-width: 640px) {
      .login-page {
        padding: 16px;
      }

      .brand-title {
        font-size: 26px;
      }

      .login-actions {
        flex-direction: column;
      }
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService)
  private readonly toastService = inject(ToastService)

  email = ''
  password = ''
  loading = false

  fillAdmin(): void {
    this.email = 'admin@biblioteca.com'
    this.password = 'admin123'
  }

  submit(): void {
    if (!this.email || !this.password) {
      this.toastService.error('Preencha email e senha para entrar.')
      return
    }

    this.loading = true
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.loading = false
        if (response.usuario.role === 'membro') {
          this.authService.logout(false)
          this.toastService.warning('Perfis de membro nao possuem painel nesta aplicacao.')
          return
        }

        this.toastService.success(`Bem-vindo, ${response.usuario.firstName}!`)
        this.authService.navigateToDashboard()
      },
      error: (error) => {
        this.loading = false
        const message = error?.error?.error || 'Nao foi possivel fazer login.'
        this.toastService.error(message)
      }
    })
  }
}
