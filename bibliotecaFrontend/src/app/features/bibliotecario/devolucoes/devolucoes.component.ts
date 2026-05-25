import { Component, OnInit, inject, signal } from '@angular/core'
import { NgClass } from '@angular/common'
import { ToastService } from '../../../core/services/toast.service'
import { EmprestimosApiService } from '../../../core/services/emprestimos-api.service'
import { Emprestimo } from '../../../core/models/library.models'

interface LoanView {
  id: number
  title: string
  member: string
  memberId: string
  dueDate: string
  daysLate: number
  fine: number
  status: 'overdue' | 'current'
}

@Component({
  selector: 'app-devolucoes',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="alert alert-warning mb-16">
      <span class="material-icons-round">warning_amber</span>
      <div><strong>{{ overdueCount }} itens atrasados</strong> - Taxa estimada: R$1,50/dia.</div>
    </div>

    <div class="card">
      <div class="tabs">
        <div class="tab" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
          Todos Ativos <span class="tab-badge primary">{{ loans.length }}</span>
        </div>
        <div class="tab" [class.active]="activeFilter() === 'overdue'" (click)="setFilter('overdue')">
          Atrasados <span class="tab-badge error">{{ overdueCount }}</span>
        </div>
        <div class="tab" [class.active]="activeFilter() === 'current'" (click)="setFilter('current')">
          No Prazo
        </div>
      </div>

      <div class="table-wrap" style="border:none; border-radius:0 0 var(--radius-lg) var(--radius-lg);">
        <table>
          <thead>
            <tr>
              <th>Emprestimo</th>
              <th>Livro</th>
              <th>Membro</th>
              <th>Vencimento</th>
              <th>Dias</th>
              <th>Multa Est.</th>
              <th>Status</th>
              <th style="text-align:right;">Acao</th>
            </tr>
          </thead>
          <tbody>
            @for (loan of filteredLoans(); track loan.id) {
              <tr>
                <td style="font-family:monospace;">#{{ loan.id }}</td>
                <td>{{ loan.title }}</td>
                <td>
                  <div>{{ loan.member }}</div>
                  <div style="font-size:11px; color:var(--md-on-surface-variant);">{{ loan.memberId }}</div>
                </td>
                <td>{{ formatDate(loan.dueDate) }}</td>
                <td [style.color]="loan.daysLate > 0 ? 'var(--md-error)' : 'inherit'" [style.fontWeight]="loan.daysLate > 0 ? '600' : 'normal'">
                  {{ loan.daysLate > 0 ? '+' + loan.daysLate : remainingDaysLabel(loan.daysLate) }}
                </td>
                <td [style.color]="loan.fine > 0 ? 'var(--md-error)' : 'inherit'">
                  {{ loan.fine > 0 ? formatCurrency(loan.fine) : '-' }}
                </td>
                <td>
                  <span class="chip" [ngClass]="loan.status === 'overdue' ? 'chip-overdue' : 'chip-active'">
                    {{ loan.status === 'overdue' ? 'Atrasado' : 'Ativo' }}
                  </span>
                </td>
                <td style="text-align:right;">
                  <button class="btn btn-sm" [class.btn-error]="loan.status === 'overdue'" [class.btn-outlined]="loan.status === 'current'" type="button" (click)="openReturnModal(loan)">
                    <span class="material-icons-round">assignment_return</span>Devolver
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" [class.open]="modalOpen()" (click)="closeOnBackdrop($event)">
      @if (selectedLoan()) {
        <div class="modal">
          <div class="modal-header">
            <div class="modal-icon" style="background:var(--md-error-container);">
              <span class="material-icons-round" style="color:var(--md-error)">receipt</span>
            </div>
            <div>
              <div class="modal-title">Devolucao: {{ selectedLoan()!.title }}</div>
              <div class="modal-subtitle">{{ selectedLoan()!.member }} - {{ selectedLoan()!.memberId }}</div>
            </div>
            <button class="icon-btn modal-close" type="button" (click)="modalOpen.set(false)">
              <span class="material-icons-round">close</span>
            </button>
          </div>
          <div class="modal-body">
            @if (selectedLoan()!.daysLate > 0) {
              <div class="fine-display">
                <div class="fine-amount">{{ formatCurrency(selectedLoan()!.fine) }}</div>
                <div class="fine-label">MULTA ESTIMADA</div>
                <div class="fine-detail">{{ selectedLoan()!.daysLate }} dia(s) de atraso</div>
              </div>
            } @else {
              <div class="alert alert-success">
                <span class="material-icons-round">check_circle</span>
                <div>Devolucao no prazo - sem multa estimada.</div>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-outlined" type="button" (click)="modalOpen.set(false)">Cancelar</button>
            <button class="btn btn-primary" type="button" (click)="confirmReturn()" [disabled]="processingReturn">
              <span class="material-icons-round">check_circle</span>
              {{ processingReturn ? 'Processando...' : 'Confirmar devolucao' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .mb-16 { margin-bottom: 16px; }
    .tab-badge { font-size: 10px; padding: 1px 6px; border-radius: 10px; margin-left: 4px; }
    .tab-badge.primary { background: var(--md-primary-container); color: var(--md-primary); }
    .tab-badge.error { background: var(--md-error-container); color: var(--md-error); }
    .fine-detail { font-size: 12px; color: var(--md-error); margin-top: 4px; }
  `]
})
export class DevolucoesComponent implements OnInit {
  private readonly toast = inject(ToastService)
  private readonly emprestimosApi = inject(EmprestimosApiService)

  readonly activeFilter = signal<'all' | 'overdue' | 'current'>('all')
  readonly modalOpen = signal(false)
  readonly selectedLoan = signal<LoanView | null>(null)

  loans: LoanView[] = []
  processingReturn = false

  ngOnInit(): void {
    this.loadLoans()
  }

  get overdueCount(): number {
    return this.loans.filter((loan) => loan.status === 'overdue').length
  }

  filteredLoans(): LoanView[] {
    const filter = this.activeFilter()
    if (filter === 'all') {
      return this.loans
    }
    return this.loans.filter((loan) => loan.status === filter)
  }

  setFilter(filter: 'all' | 'overdue' | 'current'): void {
    this.activeFilter.set(filter)
  }

  openReturnModal(loan: LoanView): void {
    this.selectedLoan.set(loan)
    this.modalOpen.set(true)
  }

  confirmReturn(): void {
    const loan = this.selectedLoan()
    if (!loan) {
      return
    }

    this.processingReturn = true
    this.emprestimosApi.devolver(loan.id).subscribe({
      next: () => {
        this.processingReturn = false
        this.modalOpen.set(false)
        this.toast.success(`Devolucao de "${loan.title}" registrada com sucesso!`)
        this.loadLoans()
      },
      error: (error) => {
        this.processingReturn = false
        this.toast.error(error?.error?.error || 'Nao foi possivel registrar a devolucao.')
      }
    })
  }

  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.modalOpen.set(false)
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

  remainingDaysLabel(daysLate: number): string {
    return `${Math.abs(daysLate)} restantes`
  }

  private loadLoans(): void {
    this.emprestimosApi.list().subscribe({
      next: (loans) => {
        this.loans = loans
          .filter((loan) => !loan.dataDevolucaoReal)
          .map((loan) => this.toLoanView(loan))
          .sort((left, right) => right.daysLate - left.daysLate)
      },
      error: () => {
        this.toast.error('Nao foi possivel carregar os emprestimos ativos.')
      }
    })
  }

  private toLoanView(loan: Emprestimo): LoanView {
    const dueDate = new Date(loan.dataDevolucaoPrevista)
    const today = new Date(new Date().toISOString().split('T')[0])
    const msPerDay = 1000 * 60 * 60 * 24
    const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / msPerDay)
    const isOverdue = daysLate > 0

    return {
      id: loan.id,
      title: loan.Livro?.titulo || `Livro #${loan.livroId}`,
      member: loan.Membro?.nome || `Membro #${loan.membroId}`,
      memberId: loan.Membro?.matricula || `ID ${loan.membroId}`,
      dueDate: loan.dataDevolucaoPrevista,
      daysLate,
      fine: isOverdue ? daysLate * 1.5 : 0,
      status: isOverdue ? 'overdue' : 'current'
    }
  }
}
