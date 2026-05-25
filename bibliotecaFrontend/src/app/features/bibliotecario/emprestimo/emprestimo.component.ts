import { Component, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { forkJoin } from 'rxjs'
import { ToastService } from '../../../core/services/toast.service'
import { LivrosApiService } from '../../../core/services/livros-api.service'
import { MembrosApiService } from '../../../core/services/membros-api.service'
import { EmprestimosApiService } from '../../../core/services/emprestimos-api.service'
import { Emprestimo, Livro, Membro } from '../../../core/models/library.models'

interface LoanAlert {
  id: number
  title: string
  member: string
  daysLate: number
  fine: number
}

@Component({
  selector: 'app-emprestimo',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="grid-2 mb-16">
      <div class="card">
        <div class="card-header">
          <div class="card-icon" style="background:var(--md-primary-container);">
            <span class="material-icons-round" style="color:var(--md-primary)">library_add</span>
          </div>
          <div>
            <div class="card-title">Novo Emprestimo</div>
            <div class="card-subtitle">Use o ID do livro, ISBN ou matricula do membro</div>
          </div>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Livro</label>
              <div class="input-with-icon">
                <span class="material-icons-round input-icon">menu_book</span>
                <input type="text" class="form-input" placeholder="ID, ISBN ou titulo" [(ngModel)]="loanBookId">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Membro</label>
              <div class="input-with-icon">
                <span class="material-icons-round input-icon">badge</span>
                <input type="text" class="form-input" placeholder="ID, matricula, email ou nome" [(ngModel)]="loanMemberId">
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Data do emprestimo</label>
              <input type="date" class="form-input" [(ngModel)]="loanDate" (change)="updateDueDate()">
            </div>
            <div class="form-group">
              <label class="form-label">Data prevista de devolucao</label>
              <input type="date" class="form-input" [(ngModel)]="loanDueDate" readonly>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Prazo</label>
            <select class="form-select" [(ngModel)]="loanDuration" (change)="updateDueDate()">
              <option value="7">7 dias</option>
              <option value="14">14 dias</option>
              <option value="21">21 dias</option>
              <option value="30">30 dias</option>
            </select>
          </div>

          <div style="display:flex; gap:8px;">
            <button class="btn btn-primary w-full" type="button" (click)="registerLoan()" [disabled]="loading">
              <span class="material-icons-round">add_circle</span>
              {{ loading ? 'Registrando...' : 'Registrar emprestimo' }}
            </button>
            <button class="btn btn-outlined" type="button" (click)="clearForm()">
              <span class="material-icons-round">clear</span>
            </button>
          </div>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="card">
          <div class="card-header">
            <div class="card-icon" style="background:var(--md-error-container);">
              <span class="material-icons-round" style="color:var(--md-error)">warning</span>
            </div>
            <div>
              <div class="card-title">Alertas de atraso</div>
              <div class="card-subtitle">{{ overdueAlerts.length }} itens precisam de devolucao</div>
            </div>
            <a class="btn btn-sm btn-tonal ml-auto" routerLink="/bibliotecario/devolucoes">Abrir devolucoes</a>
          </div>
          <div class="card-body" style="padding:0;">
            @if (overdueAlerts.length === 0) {
              <div style="padding:18px 20px; color:var(--md-on-surface-variant);">
                Nenhum atraso no momento.
              </div>
            } @else {
              @for (alert of overdueAlerts; track alert.id) {
                <div class="list-row">
                  <span class="chip chip-overdue">{{ alert.daysLate }} dia(s)</span>
                  <div class="list-row-content">
                    <div class="list-row-title">{{ alert.title }}</div>
                    <div class="list-row-subtitle">{{ alert.member }} · Multa estimada: {{ formatCurrency(alert.fine) }}</div>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-icon" style="background:var(--md-secondary-container);">
              <span class="material-icons-round" style="color:var(--md-secondary)">history</span>
            </div>
            <div>
              <div class="card-title">Emprestimos recentes</div>
              <div class="card-subtitle">Ultimos registros ativos</div>
            </div>
          </div>
          <div class="card-body" style="padding:0;">
            @if (recentLoans.length === 0) {
              <div style="padding:18px 20px; color:var(--md-on-surface-variant);">
                Nenhum emprestimo ativo encontrado.
              </div>
            } @else {
              @for (loan of recentLoans; track loan.id) {
                <div class="list-row">
                  <div class="card-icon" style="background:var(--md-primary-container); width:32px; height:32px;">
                    <span class="material-icons-round" style="font-size:16px; color:var(--md-primary)">book</span>
                  </div>
                  <div class="list-row-content">
                    <div class="list-row-title">{{ loan.Livro?.titulo || 'Livro' }}</div>
                    <div class="list-row-subtitle">{{ loan.Membro?.nome || 'Membro' }} · Vence {{ formatDate(loan.dataDevolucaoPrevista) }}</div>
                  </div>
                  <span class="chip chip-active">Ativo</span>
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-icon" style="background:var(--md-surface-variant);">
          <span class="material-icons-round" style="color:var(--md-on-surface-variant)">info</span>
        </div>
        <div>
          <div class="card-title">Referencias rapidas</div>
          <div class="card-subtitle">Use estes dados para localizar registros no backend</div>
        </div>
      </div>
      <div class="table-wrap" style="border:none; border-radius:0 0 var(--radius-lg) var(--radius-lg);">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Referencia</th>
              <th>Descricao</th>
            </tr>
          </thead>
          <tbody>
            @for (book of books.slice(0, 4); track book.id) {
              <tr>
                <td>Livro</td>
                <td>#{{ book.id }} / {{ book.isbn || 'sem ISBN' }}</td>
                <td>{{ book.titulo }} - {{ book.autor }}</td>
              </tr>
            }
            @for (member of members.slice(0, 4); track member.id) {
              <tr>
                <td>Membro</td>
                <td>#{{ member.id }} / {{ member.matricula || 'sem matricula' }}</td>
                <td>{{ member.nome }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" [class.open]="modalOpen" (click)="closeModal($event)">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-icon" style="background:var(--md-primary-container);">
            <span class="material-icons-round" style="color:var(--md-primary)">check_circle</span>
          </div>
          <div>
            <div class="modal-title">Emprestimo registrado</div>
            <div class="modal-subtitle">O backend confirmou a operacao com sucesso</div>
          </div>
          <button class="icon-btn modal-close" type="button" (click)="modalOpen = false">
            <span class="material-icons-round">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div style="background:var(--md-secondary-container); border-radius:var(--radius-md); padding:16px; text-align:center;">
            <div style="font-family:'DM Serif Display',serif; font-size:28px; color:var(--md-secondary);">#{{ createdLoanId }}</div>
            <div style="font-size:12px; color:var(--md-secondary); margin-top:4px;">ID DO EMPRESTIMO</div>
          </div>
          <div style="margin-top:12px; font-size:13px; color:var(--md-on-surface-variant); text-align:center;">
            Livro <strong>{{ createdBookLabel }}</strong> emprestado para <strong>{{ createdMemberLabel }}</strong>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" type="button" (click)="modalOpen = false">
            <span class="material-icons-round">done</span>Concluir
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .list-row { padding: 12px 16px; border-bottom: 1px solid var(--md-outline-variant); display: flex; align-items: center; gap: 10px; }
    .list-row:last-child { border-bottom: none; }
    .list-row-content { flex: 1; min-width: 0; }
    .list-row-title { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .list-row-subtitle { font-size: 11px; color: var(--md-on-surface-variant); }
  `]
})
export class EmprestimoComponent implements OnInit {
  private readonly toast = inject(ToastService)
  private readonly livrosApi = inject(LivrosApiService)
  private readonly membrosApi = inject(MembrosApiService)
  private readonly emprestimosApi = inject(EmprestimosApiService)

  books: Livro[] = []
  members: Membro[] = []
  recentLoans: Emprestimo[] = []
  overdueAlerts: LoanAlert[] = []

  loanBookId = ''
  loanMemberId = ''
  loanDate = ''
  loanDueDate = ''
  loanDuration = '14'
  loading = false

  modalOpen = false
  createdLoanId = 0
  createdBookLabel = ''
  createdMemberLabel = ''

  ngOnInit(): void {
    this.loanDate = this.todayIso()
    this.updateDueDate()
    this.loadData()
  }

  updateDueDate(): void {
    const startDate = new Date(this.loanDate || this.todayIso())
    startDate.setDate(startDate.getDate() + Number(this.loanDuration))
    this.loanDueDate = startDate.toISOString().split('T')[0]
  }

  registerLoan(): void {
    const book = this.resolveBook(this.loanBookId)
    const member = this.resolveMember(this.loanMemberId)

    if (!book || !member) {
      this.toast.error('Nao encontrei o livro ou o membro informado.')
      return
    }

    this.loading = true
    this.emprestimosApi.create({
      livroId: book.id,
      membroId: member.id,
      dataEmprestimo: this.loanDate,
      dataDevolucaoPrevista: this.loanDueDate
    }).subscribe({
      next: ({ emprestimo }) => {
        this.loading = false
        this.createdLoanId = emprestimo.id
        this.createdBookLabel = `${book.titulo} (#${book.id})`
        this.createdMemberLabel = member.nome
        this.modalOpen = true
        this.toast.success('Emprestimo registrado com sucesso!')
        this.clearForm()
        this.loadData()
      },
      error: (error) => {
        this.loading = false
        this.toast.error(error?.error?.error || 'Nao foi possivel registrar o emprestimo.')
      }
    })
  }

  clearForm(): void {
    this.loanBookId = ''
    this.loanMemberId = ''
    this.loanDate = this.todayIso()
    this.updateDueDate()
  }

  closeModal(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.modalOpen = false
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  private loadData(): void {
    forkJoin({
      books: this.livrosApi.list(),
      members: this.membrosApi.list(),
      loans: this.emprestimosApi.list()
    }).subscribe({
      next: ({ books, members, loans }) => {
        this.books = books
        this.members = members
        const activeLoans = loans.filter((loan) => !loan.dataDevolucaoReal)
        this.recentLoans = [...activeLoans]
          .sort((left, right) => right.id - left.id)
          .slice(0, 5)
        this.overdueAlerts = activeLoans
          .map((loan) => this.toOverdueAlert(loan))
          .filter((alert): alert is LoanAlert => !!alert)
      },
      error: () => {
        this.toast.error('Nao foi possivel carregar os dados para emprestimos.')
      }
    })
  }

  private resolveBook(rawValue: string): Livro | undefined {
    const value = rawValue.trim().toLowerCase()
    if (!value) {
      return undefined
    }

    return this.books.find((book) =>
      String(book.id) === value ||
      book.isbn?.toLowerCase() === value ||
      book.titulo.toLowerCase() === value
    )
  }

  private resolveMember(rawValue: string): Membro | undefined {
    const value = rawValue.trim().toLowerCase()
    if (!value) {
      return undefined
    }

    return this.members.find((member) =>
      String(member.id) === value ||
      member.matricula?.toLowerCase() === value ||
      member.email?.toLowerCase() === value ||
      member.nome.toLowerCase() === value
    )
  }

  private toOverdueAlert(loan: Emprestimo): LoanAlert | null {
    const dueDate = new Date(loan.dataDevolucaoPrevista)
    const today = new Date(this.todayIso())
    const msPerDay = 1000 * 60 * 60 * 24
    const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / msPerDay)

    if (daysLate <= 0) {
      return null
    }

    return {
      id: loan.id,
      title: loan.Livro?.titulo || `Livro #${loan.livroId}`,
      member: loan.Membro?.nome || `Membro #${loan.membroId}`,
      daysLate,
      fine: daysLate * 1.5
    }
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0]
  }
}
