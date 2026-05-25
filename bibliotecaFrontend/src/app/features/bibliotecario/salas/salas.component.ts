import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgClass } from '@angular/common'
import { ToastService } from '../../../core/services/toast.service'
import { SalasApiService } from '../../../core/services/salas-api.service'
import { ReservaSala } from '../../../core/models/library.models'

interface RoomDefinition {
  id: string
  name: string
  capacity: number
}

interface RoomView extends RoomDefinition {
  status: 'available' | 'booked'
  booking?: string
}

@Component({
  selector: 'app-salas',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="grid-2 mb-16" style="align-items:start;">
      <div class="card">
        <div class="card-header">
          <div class="card-icon" style="background:var(--md-primary-container);">
            <span class="material-icons-round" style="color:var(--md-primary)">calendar_month</span>
          </div>
          <div style="flex:1;">
            <div class="card-title">{{ monthLabel }}</div>
            <div class="card-subtitle">Selecione uma data para ver e criar reservas</div>
          </div>
        </div>
        <div class="card-body">
          <div class="cal-header">
            <div class="cal-day-name">Dom</div><div class="cal-day-name">Seg</div>
            <div class="cal-day-name">Ter</div><div class="cal-day-name">Qua</div>
            <div class="cal-day-name">Qui</div><div class="cal-day-name">Sex</div>
            <div class="cal-day-name">Sab</div>
          </div>
          <div class="cal-grid">
            @for (day of calendarDays; track $index) {
              <div
                class="cal-day"
                [class.empty]="day === 0"
                [class.today]="day === todayDay"
                [class.has-booking]="day !== 0 && bookedDays.includes(day)"
                [class.selected]="day !== 0 && selectedDay() === day"
                (click)="day !== 0 && selectDay(day)">
                {{ day !== 0 ? day : '' }}
              </div>
            }
          </div>
          <div class="divider"></div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <div class="legend-item"><div class="legend-dot" style="background:var(--md-primary-container);border:1px solid var(--md-primary);"></div>Hoje</div>
            <div class="legend-item"><div class="legend-dot" style="background:rgba(17,122,101,0.15);"></div>Com reservas</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--md-primary);"></div>Selecionado</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-icon" style="background:var(--md-secondary-container);">
            <span class="material-icons-round" style="color:var(--md-secondary)">meeting_room</span>
          </div>
          <div>
            <div class="card-title">Status das salas</div>
            <div class="card-subtitle">{{ selectedDateLabel() }}</div>
          </div>
          <button class="btn btn-sm btn-primary ml-auto" type="button" (click)="openBookingModal()">
            <span class="material-icons-round">add</span>Reservar
          </button>
        </div>
        <div class="card-body">
          <div class="room-grid">
            @for (room of roomViews(); track room.id) {
              <div class="room-card" [class.booked]="room.status === 'booked'" (click)="onRoomClick(room)">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
                  <span class="material-icons-round" style="font-size:22px;" [style.color]="room.status === 'booked' ? 'var(--md-secondary)' : 'var(--md-on-surface-variant)'">
                    meeting_room
                  </span>
                  <span class="chip" [ngClass]="room.status === 'booked' ? 'chip-active' : 'chip-neutral'" style="font-size:10px;">
                    {{ room.status === 'booked' ? 'Reservada' : 'Livre' }}
                  </span>
                </div>
                <div class="room-name">{{ room.name }}</div>
                <div class="room-cap"><span class="material-icons-round">group</span>{{ room.capacity }} pessoas</div>
                @if (room.booking) {
                  <div style="font-size:10px;color:var(--md-secondary);margin-top:4px;">{{ room.booking }}</div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-icon" style="background:var(--md-surface-variant);">
          <span class="material-icons-round" style="color:var(--md-on-surface-variant)">event_note</span>
        </div>
        <div>
          <div class="card-title">Reservas atuais</div>
          <div class="card-subtitle">Resultado direto da API de salas</div>
        </div>
      </div>
      <div class="table-wrap" style="border:none; border-radius:0 0 var(--radius-lg) var(--radius-lg);">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Sala</th>
              <th>Data</th>
              <th>Horario</th>
              <th>Membro</th>
            </tr>
          </thead>
          <tbody>
            @for (reservation of reservations; track reservation.id) {
              <tr>
                <td>#{{ reservation.id }}</td>
                <td>{{ reservation.sala }}</td>
                <td>{{ formatDate(reservation.data) }}</td>
                <td>{{ reservation.horario }}</td>
                <td>{{ reservation.memberId }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="modal-overlay" [class.open]="modalOpen()" (click)="closeOnBackdrop($event)">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-icon" style="background:var(--md-secondary-container);">
            <span class="material-icons-round" style="color:var(--md-secondary)">meeting_room</span>
          </div>
          <div>
            <div class="modal-title">Reservar sala de estudos</div>
            <div class="modal-subtitle">Os dados serao enviados para o backend</div>
          </div>
          <button class="icon-btn modal-close" type="button" (click)="modalOpen.set(false)">
            <span class="material-icons-round">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Sala</label>
              <select class="form-select" [(ngModel)]="bookingRoom">
                @for (room of rooms; track room.id) {
                  <option [value]="room.name">{{ room.name }} ({{ room.capacity }} pessoas)</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Data</label>
              <input type="date" class="form-input" [(ngModel)]="bookingDate">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Horario</label>
              <select class="form-select" [(ngModel)]="bookingStart">
                <option>08:00</option><option>09:00</option><option>10:00</option>
                <option>11:00</option><option>14:00</option><option>15:00</option>
                <option>16:00</option><option>17:00</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Duracao</label>
              <select class="form-select" [(ngModel)]="bookingDuration">
                <option>1 hora</option><option>2 horas</option><option>3 horas</option><option>Dia inteiro</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Membro / Grupo</label>
            <div class="input-with-icon">
              <span class="material-icons-round input-icon">badge</span>
              <input type="text" class="form-input" placeholder="ID do membro ou grupo" [(ngModel)]="bookingMember">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outlined" type="button" (click)="modalOpen.set(false)">Cancelar</button>
          <button class="btn btn-secondary" type="button" (click)="confirmBooking()" [disabled]="saving">
            <span class="material-icons-round">event_available</span>
            {{ saving ? 'Salvando...' : 'Confirmar reserva' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`.mb-16{margin-bottom:16px;}`]
})
export class SalasComponent implements OnInit {
  private readonly toast = inject(ToastService)
  private readonly salasApi = inject(SalasApiService)

  readonly modalOpen = signal(false)
  readonly selectedDay = signal(new Date().getDate())

  readonly rooms: RoomDefinition[] = [
    { id: 'A1', name: 'Sala A1', capacity: 6 },
    { id: 'A2', name: 'Sala A2', capacity: 4 },
    { id: 'B1', name: 'Sala B1', capacity: 6 },
    { id: 'B2', name: 'Sala B2', capacity: 4 },
    { id: 'C1', name: 'Sala C1', capacity: 8 },
    { id: 'C2', name: 'Sala C2', capacity: 4 }
  ]

  readonly currentDate = new Date()
  readonly todayDay = this.currentDate.getDate()
  readonly monthIndex = this.currentDate.getMonth()
  readonly currentYear = this.currentDate.getFullYear()

  monthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).format(this.currentDate)

  calendarDays: number[] = []
  reservations: ReservaSala[] = []
  bookedDays: number[] = []

  bookingRoom = this.rooms[0].name
  bookingDate = ''
  bookingStart = '09:00'
  bookingDuration = '2 horas'
  bookingMember = ''
  saving = false

  ngOnInit(): void {
    this.generateCalendar()
    this.bookingDate = this.selectedDateIso()
    this.loadReservations()
  }

  selectedDateLabel = signal('')

  selectDay(day: number): void {
    this.selectedDay.set(day)
    this.bookingDate = this.selectedDateIso()
    this.selectedDateLabel.set(this.formatDate(this.bookingDate))
  }

  roomViews(): RoomView[] {
    const selectedDate = this.selectedDateIso()
    return this.rooms.map((room) => {
      const reservation = this.reservations.find((item) => item.sala === room.name && item.data === selectedDate)
      if (!reservation) {
        return { ...room, status: 'available' }
      }

      return {
        ...room,
        status: 'booked',
        booking: `${reservation.memberId} - ${reservation.horario}`
      }
    })
  }

  onRoomClick(room: RoomView): void {
    if (room.status === 'booked') {
      this.toast.info(`${room.name}: ${room.booking}`)
      return
    }

    this.bookingRoom = room.name
    this.openBookingModal()
  }

  openBookingModal(): void {
    this.bookingDate = this.selectedDateIso()
    this.modalOpen.set(true)
  }

  confirmBooking(): void {
    if (!this.bookingMember) {
      this.toast.error('Informe o ID do membro ou nome do grupo.')
      return
    }

    this.saving = true
    this.salasApi.create({
      sala: this.bookingRoom,
      data: this.bookingDate,
      horario: this.bookingStart,
      duracao: this.bookingDuration,
      memberId: this.bookingMember
    }).subscribe({
      next: () => {
        this.saving = false
        this.modalOpen.set(false)
        this.toast.success(`${this.bookingRoom} reservada com sucesso!`)
        this.bookingMember = ''
        this.loadReservations()
      },
      error: (error) => {
        this.saving = false
        this.toast.error(error?.error?.error || 'Nao foi possivel salvar a reserva.')
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

  private loadReservations(): void {
    this.salasApi.list().subscribe({
      next: (reservations) => {
        this.reservations = reservations
        this.bookedDays = reservations
          .filter((item) => {
            const date = new Date(item.data)
            return date.getMonth() === this.monthIndex && date.getFullYear() === this.currentYear
          })
          .map((item) => new Date(item.data).getDate())
        this.selectedDateLabel.set(this.formatDate(this.selectedDateIso()))
      },
      error: () => {
        this.toast.error('Nao foi possivel carregar as reservas de sala.')
      }
    })
  }

  private generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.monthIndex, 1).getDay()
    const daysInMonth = new Date(this.currentYear, this.monthIndex + 1, 0).getDate()
    this.calendarDays = Array(firstDay).fill(0)
    for (let day = 1; day <= daysInMonth; day += 1) {
      this.calendarDays.push(day)
    }
  }

  private selectedDateIso(): string {
    const date = new Date(this.currentYear, this.monthIndex, this.selectedDay())
    return date.toISOString().split('T')[0]
  }
}
