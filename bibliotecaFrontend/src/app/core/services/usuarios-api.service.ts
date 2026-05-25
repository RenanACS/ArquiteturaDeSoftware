import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Usuario } from '../models/library.models'

@Injectable({ providedIn: 'root' })
export class UsuariosApiService {
  private readonly http = inject(HttpClient)

  list() {
    return this.http.get<Usuario[]>('/api/usuarios')
  }

  create(payload: Pick<Usuario, 'firstName' | 'lastName' | 'email' | 'role'> & { password: string }) {
    return this.http.post<{ message: string, usuario: Usuario }>('/api/usuarios', payload)
  }

  toggleStatus(id: number) {
    return this.http.patch<{ message: string }>(`/api/usuarios/${id}/status`, {})
  }
}
