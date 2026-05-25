import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Livro } from '../models/library.models'

@Injectable({ providedIn: 'root' })
export class LivrosApiService {
  private readonly http = inject(HttpClient)

  list() {
    return this.http.get<Livro[]>('/api/livros')
  }

  create(payload: Pick<Livro, 'titulo' | 'autor' | 'isbn' | 'categoria' | 'tipo' | 'copias'>) {
    return this.http.post<{ message: string, livro: Livro }>('/api/livros', payload)
  }

  update(id: number, payload: Partial<Pick<Livro, 'titulo' | 'autor' | 'isbn' | 'categoria' | 'tipo' | 'copias'>>) {
    return this.http.put<{ message: string, livro: Livro }>(`/api/livros/${id}`, payload)
  }

  remove(id: number) {
    return this.http.delete<{ message: string }>(`/api/livros/${id}`)
  }
}
