import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { ReservaSala } from '../models/library.models'

@Injectable({ providedIn: 'root' })
export class SalasApiService {
  private readonly http = inject(HttpClient)

  list() {
    return this.http.get<ReservaSala[]>('/api/salas')
  }

  create(payload: Pick<ReservaSala, 'sala' | 'data' | 'horario' | 'duracao' | 'memberId'>) {
    return this.http.post<{ message: string, reserva: ReservaSala }>('/api/salas', payload)
  }

  remove(id: number) {
    return this.http.delete<{ message: string }>(`/api/salas/${id}`)
  }
}
