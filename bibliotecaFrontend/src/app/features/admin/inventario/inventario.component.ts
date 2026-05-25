import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgClass } from '@angular/common'
import { ToastService } from '../../../core/services/toast.service'
import { LivrosApiService } from '../../../core/services/livros-api.service'
import { Livro } from '../../../core/models/library.models'

interface InventoryItem extends Livro {
  selected: boolean
  status: 'available' | 'loaned'
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="section-header mb-20">
      <div>
        <div class="section-title">Inventario do acervo</div>
        <div style="font-size:12px;color:var(--md-on-surface-variant);margin-top:2px;">
          {{ totalCopies }} itens no total · {{ totalAvailable }} copias disponiveis
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" type="button" (click)="openAddModal()">
          <span class="material-icons-round">add</span>Adicionar item
        </button>
      </div>
    </div>

    <div class="grid-4 mb-20">
      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon-wrap" style="background:var(--md-primary-container);">
            <span class="material-icons-round" style="color:var(--md-primary)">menu_book</span>
          </div>
        </div>
        <div class="stat-value">{{ bookTypeCount('Livro') }}</div>
        <div class="stat-label">Livros</div>
      </div>
      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon-wrap" style="background:#F4ECF7;">
            <span class="material-icons-round" style="color:var(--md-tertiary)">article</span>
          </div>
        </div>
        <div class="stat-value">{{ bookTypeCount('Revista') }}</div>
        <div class="stat-label">Revistas</div>
      </div>
      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon-wrap" style="background:var(--md-secondary-container);">
            <span class="material-icons-round" style="color:var(--md-secondary)">laptop</span>
          </div>
        </div>
        <div class="stat-value">{{ digitalMediaCount }}</div>
        <div class="stat-label">Midia Digital</div>
      </div>
      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon-wrap" style="background:var(--md-error-container);">
            <span class="material-icons-round" style="color:var(--md-error)">inventory</span>
          </div>
        </div>
        <div class="stat-value">{{ totalLoanedCopies }}</div>
        <div class="stat-label">Copias emprestadas</div>
      </div>
    </div>

    <div class="card">
      <div style="padding:16px 20px;border-bottom:1px solid var(--md-outline-variant);display:flex;align-items:center;gap:12px;">
        <div class="search-bar" style="width:320px;background:var(--md-surface-variant);">
          <span class="material-icons-round">search</span>
          <input type="text" placeholder="Buscar por titulo, autor ou ISBN" [(ngModel)]="searchQuery">
        </div>
      </div>
      <div class="table-wrap" style="border:none;border-radius:0 0 var(--radius-lg) var(--radius-lg);">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" style="cursor:pointer;" (change)="toggleAll($event)"></th>
              <th>Item</th>
              <th>Autor</th>
              <th>ISBN / ID</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Copias</th>
              <th style="text-align:right;">Acoes</th>
            </tr>
          </thead>
          <tbody>
            @for (item of filteredItems(); track item.id) {
              <tr>
                <td><input type="checkbox" [(ngModel)]="item.selected"></td>
                <td><div style="font-weight:500;">{{ item.titulo }}</div></td>
                <td>{{ item.autor }}</td>
                <td style="font-family:monospace;font-size:11px;">{{ item.isbn || '#' + item.id }}</td>
                <td>{{ item.categoria || '-' }}</td>
                <td><span class="chip chip-info">{{ normalizeType(item.tipo) }}</span></td>
                <td>
                  <span class="chip" [ngClass]="item.status === 'available' ? 'chip-active' : 'chip-returned'">
                    {{ item.status === 'available' ? 'Disponivel' : 'Emprestado' }}
                  </span>
                </td>
                <td>{{ item.copiasDisponiveis }}/{{ item.copias }}</td>
                <td style="text-align:right;">
                  <button class="btn btn-sm btn-outlined" style="color:var(--md-error);border-color:var(--md-error);" type="button" (click)="deleteItem(item)">
                    <span class="material-icons-round">delete</span>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" [class.open]="modalOpen()" (click)="closeOnBackdrop($event)">
      <div class="modal" style="width:560px;">
        <div class="modal-header">
          <div class="modal-icon" style="background:var(--md-primary-container);">
            <span class="material-icons-round" style="color:var(--md-primary)">library_add</span>
          </div>
          <div>
            <div class="modal-title">Adicionar item ao acervo</div>
            <div class="modal-subtitle">Os dados serao enviados para a API de livros</div>
          </div>
          <button class="icon-btn modal-close" type="button" (click)="modalOpen.set(false)">
            <span class="material-icons-round">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Tipo de item</label>
            <select class="form-select" [(ngModel)]="newItem.tipo">
              <option>Livro</option>
              <option>Revista</option>
              <option>Mídia Digital</option>
              <option>Jornal</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Titulo</label>
            <input type="text" class="form-input" placeholder="Titulo completo" [(ngModel)]="newItem.titulo">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Autor</label>
              <input type="text" class="form-input" placeholder="Nome do autor" [(ngModel)]="newItem.autor">
            </div>
            <div class="form-group">
              <label class="form-label">Categoria</label>
              <input type="text" class="form-input" placeholder="Categoria" [(ngModel)]="newItem.categoria">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">ISBN</label>
              <input type="text" class="form-input" placeholder="978..." [(ngModel)]="newItem.isbn">
            </div>
            <div class="form-group">
              <label class="form-label">Numero de copias</label>
              <input type="number" class="form-input" placeholder="1" [(ngModel)]="newItem.copias" min="1">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outlined" type="button" (click)="modalOpen.set(false)">Cancelar</button>
          <button class="btn btn-primary" type="button" (click)="confirmAdd()" [disabled]="saving">
            <span class="material-icons-round">add_circle</span>
            {{ saving ? 'Salvando...' : 'Adicionar ao acervo' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .section-title { font-size:16px; font-weight:600; color:var(--md-on-surface); }
    .mb-20 { margin-bottom:20px; }
    .search-bar { display:flex; align-items:center; gap:8px; border-radius:50px; padding:8px 16px; border:1px solid transparent; transition:var(--transition); }
    .search-bar input { border:none; background:none; outline:none; font-family:'DM Sans',sans-serif; font-size:13px; width:100%; }
    .search-bar .material-icons-round { font-size:18px; color:var(--md-on-surface-variant); }
  `]
})
export class InventarioComponent implements OnInit {
  private readonly toast = inject(ToastService)
  private readonly livrosApi = inject(LivrosApiService)

  readonly modalOpen = signal(false)

  items: InventoryItem[] = []
  searchQuery = ''
  saving = false

  newItem = {
    titulo: '',
    autor: '',
    isbn: '',
    categoria: '',
    tipo: 'Livro' as Livro['tipo'],
    copias: 1
  }

  ngOnInit(): void {
    this.loadItems()
  }

  get totalCopies(): number {
    return this.items.reduce((total, item) => total + item.copias, 0)
  }

  get totalAvailable(): number {
    return this.items.reduce((total, item) => total + item.copiasDisponiveis, 0)
  }

  get totalLoanedCopies(): number {
    return this.items.reduce((total, item) => total + (item.copias - item.copiasDisponiveis), 0)
  }

  get digitalMediaCount(): number {
    return this.items.filter((item) => this.normalizeType(item.tipo) === 'Midia Digital').length
  }

  bookTypeCount(type: string): number {
    return this.items.filter((item) => this.normalizeType(item.tipo) === type).length
  }

  filteredItems(): InventoryItem[] {
    if (!this.searchQuery.trim()) {
      return this.items
    }

    const query = this.searchQuery.toLowerCase()
    return this.items.filter((item) =>
      item.titulo.toLowerCase().includes(query) ||
      item.autor.toLowerCase().includes(query) ||
      item.isbn?.toLowerCase().includes(query)
    )
  }

  normalizeType(type: string): string {
    return type === 'Mídia Digital' ? 'Midia Digital' : type
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked
    this.items.forEach((item) => {
      item.selected = checked
    })
  }

  deleteItem(item: InventoryItem): void {
    this.livrosApi.remove(item.id).subscribe({
      next: () => {
        this.items = this.items.filter((current) => current.id !== item.id)
        this.toast.success(`"${item.titulo}" removido do acervo.`)
      },
      error: (error) => {
        this.toast.error(error?.error?.error || 'Nao foi possivel remover o item.')
      }
    })
  }

  openAddModal(): void {
    this.modalOpen.set(true)
  }

  confirmAdd(): void {
    if (!this.newItem.titulo || !this.newItem.autor) {
      this.toast.error('Preencha titulo e autor para cadastrar o item.')
      return
    }

    this.saving = true
    this.livrosApi.create(this.newItem).subscribe({
      next: ({ livro }) => {
        this.saving = false
        this.items = [this.toInventoryItem(livro), ...this.items]
        this.modalOpen.set(false)
        this.toast.success(`"${livro.titulo}" adicionado ao acervo!`)
        this.newItem = {
          titulo: '',
          autor: '',
          isbn: '',
          categoria: '',
          tipo: 'Livro',
          copias: 1
        }
      },
      error: (error) => {
        this.saving = false
        this.toast.error(error?.error?.error || 'Nao foi possivel salvar o item.')
      }
    })
  }

  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.modalOpen.set(false)
    }
  }

  private loadItems(): void {
    this.livrosApi.list().subscribe({
      next: (books) => {
        this.items = books.map((book) => this.toInventoryItem(book))
      },
      error: () => {
        this.toast.error('Nao foi possivel carregar o inventario.')
      }
    })
  }

  private toInventoryItem(book: Livro): InventoryItem {
    return {
      ...book,
      selected: false,
      status: book.copiasDisponiveis > 0 ? 'available' : 'loaned'
    }
  }
}
