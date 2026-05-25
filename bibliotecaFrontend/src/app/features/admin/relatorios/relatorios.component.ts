import { Component, OnInit, inject } from '@angular/core'
import { forkJoin } from 'rxjs'
import { ToastService } from '../../../core/services/toast.service'
import { LivrosApiService } from '../../../core/services/livros-api.service'
import { EmprestimosApiService } from '../../../core/services/emprestimos-api.service'
import { UsuariosApiService } from '../../../core/services/usuarios-api.service'
import { MembrosApiService } from '../../../core/services/membros-api.service'
import { Emprestimo, Livro } from '../../../core/models/library.models'

interface BarData {
  label: string
  value: number
  pct: number
}

interface BookRank {
  title: string
  author: string
  count: number
  pct: number
}

@Component({
  selector: 'app-relatorios',
  standalone: true,
  template: `
    <div class="grid-4 mb-20">
      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon-wrap" style="background:var(--md-primary-container);">
            <span class="material-icons-round" style="color:var(--md-primary)">library_books</span>
          </div>
        </div>
        <div class="stat-value">{{ totalLoans }}</div>
        <div class="stat-label">Emprestimos totais</div>
      </div>
      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon-wrap" style="background:var(--md-secondary-container);">
            <span class="material-icons-round" style="color:var(--md-secondary)">assignment_turned_in</span>
          </div>
        </div>
        <div class="stat-value">{{ onTimeReturns }}</div>
        <div class="stat-label">Devolucoes no prazo</div>
      </div>
      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon-wrap" style="background:var(--md-error-container);">
            <span class="material-icons-round" style="color:var(--md-error)">schedule</span>
          </div>
        </div>
        <div class="stat-value">{{ lateReturns }}</div>
        <div class="stat-label">Devolucoes com atraso</div>
      </div>
      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon-wrap" style="background:var(--md-warning-container);">
            <span class="material-icons-round" style="color:var(--md-warning)">payments</span>
          </div>
        </div>
        <div class="stat-value">{{ formatCurrency(totalFines) }}</div>
        <div class="stat-label">Multa estimada arrecadada</div>
      </div>
    </div>

    <div class="grid-2 mb-16">
      <div class="card">
        <div class="card-header">
          <div class="card-icon" style="background:var(--md-primary-container);">
            <span class="material-icons-round" style="color:var(--md-primary)">bar_chart</span>
          </div>
          <div>
            <div class="card-title">Emprestimos por mes</div>
            <div class="card-subtitle">Ultimos seis meses</div>
          </div>
        </div>
        <div class="card-body">
          <div class="chart-bar-group">
            @for (bar of monthlyData; track bar.label) {
              <div class="chart-bar-wrap">
                <div class="chart-value">{{ bar.value }}</div>
                <div class="chart-bar" [style.height.%]="bar.pct" [style.background]="bar.pct >= 90 ? 'var(--md-primary)' : 'var(--md-primary-light)'"></div>
                <div class="chart-label">{{ bar.label }}</div>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-icon" style="background:var(--md-secondary-container);">
            <span class="material-icons-round" style="color:var(--md-secondary)">donut_large</span>
          </div>
          <div>
            <div class="card-title">Acervo por categoria</div>
            <div class="card-subtitle">{{ booksCount }} titulos cadastrados</div>
          </div>
        </div>
        <div class="card-body" style="display:flex;gap:20px;align-items:center;">
          <div style="flex:1;">
            @for (cat of categories; track cat.label) {
              <div class="legend-item">
                <div class="legend-dot" [style.background]="cat.color"></div>
                <span style="flex:1;">{{ cat.label }}</span>
                <strong>{{ cat.pct }}%</strong>
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-icon" style="background:var(--md-primary-container);">
            <span class="material-icons-round" style="color:var(--md-primary)">star</span>
          </div>
          <div>
            <div class="card-title">Livros mais emprestados</div>
            <div class="card-subtitle">Ranking calculado a partir da API</div>
          </div>
        </div>
        <div class="card-body" style="padding:8px 0;">
          @for (book of topBooks; track book.title; let i = $index) {
            <div style="padding:10px 20px;display:flex;align-items:center;gap:12px;" [style.borderBottom]="i < topBooks.length - 1 ? '1px solid var(--md-outline-variant)' : 'none'">
              <div style="font-family:'DM Serif Display',serif;font-size:20px;color:var(--md-on-surface-variant);width:20px;text-align:center;flex-shrink:0;">{{ i + 1 }}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ book.title }}</div>
                <div style="font-size:11px;color:var(--md-on-surface-variant);margin-bottom:4px;">{{ book.author }}</div>
                <div class="progress-bar-wrap">
                  <div class="progress-bar" [style.width.%]="book.pct" style="background:var(--md-primary);"></div>
                </div>
              </div>
              <div style="font-size:12px;font-weight:600;color:var(--md-primary);flex-shrink:0;">{{ book.count }}x</div>
            </div>
          }
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-icon" style="background:var(--md-secondary-container);">
            <span class="material-icons-round" style="color:var(--md-secondary)">history</span>
          </div>
          <div>
            <div class="card-title">Historico de devolucoes</div>
            <div class="card-subtitle">Ultimas devolucoes registradas</div>
          </div>
        </div>
        <div class="table-wrap" style="border:none;border-radius:0 0 var(--radius-lg) var(--radius-lg);">
          <table>
            <thead>
              <tr><th>Livro</th><th>Membro</th><th>Data</th><th>Status</th></tr>
            </thead>
            <tbody>
              @for (item of returnHistory; track item.loan) {
                <tr>
                  <td>{{ item.title }}</td>
                  <td style="font-size:12px;color:var(--md-on-surface-variant);">{{ item.member }}</td>
                  <td style="font-size:12px;">{{ item.date }}</td>
                  <td>
                    <span class="chip" [class.chip-active]="!item.late" [class.chip-overdue]="item.late">
                      {{ item.late ? 'Atrasado' : 'No prazo' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mb-20{margin-bottom:20px;}
    .mb-16{margin-bottom:16px;}
    .chart-bar-group{display:flex;align-items:flex-end;gap:6px;height:120px;}
    .chart-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end;}
    .chart-bar{width:100%;border-radius:4px 4px 0 0;transition:height 0.6s cubic-bezier(0.4,0,0.2,1);cursor:pointer;min-height:4px;}
    .chart-bar:hover{opacity:0.8;}
    .chart-label{font-size:10px;color:var(--md-on-surface-variant);text-align:center;}
    .chart-value{font-size:10px;font-weight:600;color:var(--md-on-surface-variant);}
  `]
})
export class RelatoriosComponent implements OnInit {
  private readonly toast = inject(ToastService)
  private readonly livrosApi = inject(LivrosApiService)
  private readonly emprestimosApi = inject(EmprestimosApiService)
  private readonly usuariosApi = inject(UsuariosApiService)
  private readonly membrosApi = inject(MembrosApiService)

  totalLoans = 0
  onTimeReturns = 0
  lateReturns = 0
  totalFines = 0
  booksCount = 0

  monthlyData: BarData[] = []
  categories: Array<{ label: string, color: string, pct: number }> = []
  topBooks: BookRank[] = []
  returnHistory: Array<{ loan: number, title: string, member: string, date: string, late: boolean }> = []

  ngOnInit(): void {
    this.loadReports()
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  private loadReports(): void {
    forkJoin({
      books: this.livrosApi.list(),
      loans: this.emprestimosApi.list(),
      users: this.usuariosApi.list(),
      members: this.membrosApi.list()
    }).subscribe({
      next: ({ books, loans, users, members }) => {
        this.booksCount = books.length
        this.totalLoans = loans.length
        this.onTimeReturns = loans.filter((loan) => this.isReturnedOnTime(loan)).length
        this.lateReturns = loans.filter((loan) => this.isReturnedLate(loan)).length
        this.totalFines = loans.reduce((total, loan) => total + this.estimateFine(loan), 0)
        this.monthlyData = this.buildMonthlyData(loans)
        this.categories = this.buildCategories(books)
        this.topBooks = this.buildTopBooks(books, loans)
        this.returnHistory = this.buildReturnHistory(loans)

        if (!users.length && !members.length) {
          this.toast.info('Os relatorios estao usando os dados atuais do backend.')
        }
      },
      error: () => {
        this.toast.error('Nao foi possivel carregar os dados para os relatorios.')
      }
    })
  }

  private buildMonthlyData(loans: Emprestimo[]): BarData[] {
    const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    const today = new Date()
    const buckets: BarData[] = []

    for (let offset = 5; offset >= 0; offset -= 1) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - offset, 1)
      const count = loans.filter((loan) => {
        const loanDate = new Date(loan.dataEmprestimo)
        return loanDate.getFullYear() === monthDate.getFullYear() && loanDate.getMonth() === monthDate.getMonth()
      }).length

      buckets.push({
        label: formatter.format(monthDate),
        value: count,
        pct: 0
      })
    }

    const maxValue = Math.max(...buckets.map((item) => item.value), 1)
    return buckets.map((item) => ({
      ...item,
      pct: Math.round((item.value / maxValue) * 100)
    }))
  }

  private buildCategories(books: Livro[]) {
    const palette = ['var(--md-primary)', 'var(--md-secondary)', 'var(--md-tertiary)', '#F39C12']
    const total = Math.max(books.length, 1)
    const counts = new Map<string, number>()

    books.forEach((book) => {
      const category = book.categoria || 'Sem categoria'
      counts.set(category, (counts.get(category) || 0) + 1)
    })

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([label, count], index) => ({
        label,
        color: palette[index % palette.length],
        pct: Math.round((count / total) * 100)
      }))
  }

  private buildTopBooks(books: Livro[], loans: Emprestimo[]): BookRank[] {
    const total = new Map<number, number>()
    loans.forEach((loan) => {
      total.set(loan.livroId, (total.get(loan.livroId) || 0) + 1)
    })

    const ranking = books.map((book) => ({
      title: book.titulo,
      author: book.autor,
      count: total.get(book.id) || 0
    })).sort((left, right) => right.count - left.count).slice(0, 5)

    const maxCount = Math.max(...ranking.map((item) => item.count), 1)
    return ranking.map((item) => ({
      ...item,
      pct: Math.round((item.count / maxCount) * 100)
    }))
  }

  private buildReturnHistory(loans: Emprestimo[]) {
    return loans
      .filter((loan) => !!loan.dataDevolucaoReal)
      .sort((left, right) => new Date(right.dataDevolucaoReal || '').getTime() - new Date(left.dataDevolucaoReal || '').getTime())
      .slice(0, 5)
      .map((loan) => ({
        loan: loan.id,
        title: loan.Livro?.titulo || `Livro #${loan.livroId}`,
        member: loan.Membro?.nome || `Membro #${loan.membroId}`,
        date: loan.dataDevolucaoReal ? new Intl.DateTimeFormat('pt-BR').format(new Date(loan.dataDevolucaoReal)) : '-',
        late: this.isReturnedLate(loan)
      }))
  }

  private isReturnedOnTime(loan: Emprestimo): boolean {
    if (!loan.dataDevolucaoReal) {
      return false
    }
    return new Date(loan.dataDevolucaoReal) <= new Date(loan.dataDevolucaoPrevista)
  }

  private isReturnedLate(loan: Emprestimo): boolean {
    if (!loan.dataDevolucaoReal) {
      return false
    }
    return new Date(loan.dataDevolucaoReal) > new Date(loan.dataDevolucaoPrevista)
  }

  private estimateFine(loan: Emprestimo): number {
    if (!loan.dataDevolucaoReal) {
      return 0
    }

    const dueDate = new Date(loan.dataDevolucaoPrevista)
    const returnDate = new Date(loan.dataDevolucaoReal)
    const msPerDay = 1000 * 60 * 60 * 24
    const daysLate = Math.floor((returnDate.getTime() - dueDate.getTime()) / msPerDay)
    return daysLate > 0 ? daysLate * 1.5 : 0
  }
}
