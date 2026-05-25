import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Emprestimo } from '../models/library.models'

@Injectable({ providedIn: 'root' })
export class EmprestimosApiService {
  private readonly http = inject(HttpClient)

  list() {
    return this.http.get<Emprestimo[]>('/api/emprestimos')
  }

  create(payload: {
    livroId: number
    membroId: number
    dataEmprestimo: string
    dataDevolucaoPrevista: string
  }) {
    return this.http.post<{ message: string, emprestimo: Emprestimo }>('/api/emprestimos', payload)
  }

  devolver(id: number) {
    return this.http.patch<{ message: string, emprestimo: Emprestimo }>(`/api/emprestimos/${id}/devolver`, {})
  }
}
