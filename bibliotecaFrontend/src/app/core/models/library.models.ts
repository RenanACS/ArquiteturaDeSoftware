export type UserRole = 'admin' | 'bibliotecario' | 'membro'

export interface AuthUser {
  id: number
  firstName: string
  lastName: string
  email: string
  role: UserRole
}

export interface LoginResponse {
  message: string
  token: string
  usuario: AuthUser
}

export interface Usuario {
  id: number
  firstName: string
  lastName: string
  email: string
  role: UserRole
  status: 'active' | 'inactive'
}

export interface Livro {
  id: number
  titulo: string
  autor: string
  isbn?: string
  categoria?: string
  tipo: 'Livro' | 'Revista' | 'Midia Digital' | 'Jornal' | 'Mídia Digital'
  copias: number
  copiasDisponiveis: number
}

export interface Membro {
  id: number
  nome: string
  email?: string
  telefone?: string
  matricula?: string
  ativo: boolean
}

export interface Emprestimo {
  id: number
  livroId: number
  membroId: number
  dataEmprestimo: string
  dataDevolucaoPrevista: string
  dataDevolucaoReal?: string | null
  status: 'ativo' | 'devolvido' | 'atrasado'
  multa: number
  Livro?: Pick<Livro, 'titulo' | 'autor'>
  Membro?: Pick<Membro, 'nome' | 'matricula'>
}

export interface ReservaSala {
  id: number
  sala: string
  data: string
  horario: string
  duracao?: string
  memberId: string
  status: string
  criadoPor: string
}
