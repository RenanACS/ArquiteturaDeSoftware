import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Membro } from '../models/library.models'

@Injectable({ providedIn: 'root' })
export class MembrosApiService {
  private readonly http = inject(HttpClient)

  list() {
    return this.http.get<Membro[]>('/api/membros')
  }

  create(payload: Pick<Membro, 'nome' | 'email' | 'telefone' | 'matricula'>) {
    return this.http.post<{ message: string, membro: Membro }>('/api/membros', payload)
  }

  update(id: number, payload: Partial<Pick<Membro, 'nome' | 'email' | 'telefone' | 'matricula'>>) {
    return this.http.put<{ message: string, membro: Membro }>(`/api/membros/${id}`, payload)
  }

  toggleStatus(id: number) {
    return this.http.patch<{ message: string, membro: Membro }>(`/api/membros/${id}/status`, {})
  }
}
