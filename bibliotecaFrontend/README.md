# 📚 Bibliotheca — Angular SPA + PWA

Sistema de gerenciamento de biblioteca escolar desenvolvido com **Angular 17** como SPA (Single Page Application) com suporte a **PWA (Progressive Web App)**.

---

## ✅ Requisitos Entregues

| # | Requisito | Status |
|---|-----------|--------|
| 1 | Front-end inicial com Angular | ✅ |
| 2 | Navegação SPA com Angular Router | ✅ |
| 3 | Layout responsivo (mobile + desktop) | ✅ |
| 4 | Estrutura PWA (manifest + service worker) | ✅ |

---

## 🏗️ Estrutura do Projeto

```
src/
├── index.html                        # HTML raiz com meta tags PWA
├── main.ts                           # Bootstrap da aplicação
├── styles.css                        # Design system global (CSS vars)
├── manifest.webmanifest              # PWA manifest (ícones, tema, display)
├── ngsw-config.json                  # Angular Service Worker (cache)
│
└── app/
    ├── app.component.ts              # Root component
    ├── app.config.ts                 # provideRouter + provideServiceWorker
    ├── app.routes.ts                 # Rotas SPA com lazy loading
    │
    ├── core/
    │   └── services/
    │       └── toast.service.ts      # Serviço de notificações (Signals)
    │
    ├── shared/
    │   └── components/
    │       └── toast/
    │           └── toast.component.ts
    │
    ├── layout/
    │   ├── bibliotecario-layout/
    │   │   └── bibliotecario-layout.component.ts  # Sidebar + topbar bibliotecário
    │   └── admin-layout/
    │       └── admin-layout.component.ts           # Sidebar + topbar admin
    │
    └── features/
        ├── bibliotecario/
        │   ├── emprestimo/
        │   │   └── emprestimo.component.ts    # Formulário + alertas
        │   ├── devolucoes/
        │   │   └── devolucoes.component.ts    # Tabela + modal multas
        │   └── salas/
        │       └── salas.component.ts         # Calendário + reservas
        └── admin/
            ├── inventario/
            │   └── inventario.component.ts    # CRUD acervo
            ├── usuarios/
            │   └── usuarios.component.ts      # Cadastro membros
            └── relatorios/
                └── relatorios.component.ts    # Gráficos + stats
```

---

## 🗺️ Rotas SPA (Angular Router)

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | → redirect | Redireciona para empréstimo |
| `/bibliotecario/emprestimo` | EmprestimoComponent | Registrar empréstimos |
| `/bibliotecario/devolucoes` | DevolucoesComponent | Processar devoluções + multas |
| `/bibliotecario/salas` | SalasComponent | Reservar salas de estudo |
| `/admin/inventario` | InventarioComponent | Gerenciar acervo |
| `/admin/usuarios` | UsuariosComponent | Cadastrar membros/equipe |
| `/admin/relatorios` | RelatoriosComponent | Dashboards e análises |

> Todas as rotas usam **lazy loading** (`loadComponent`) para melhor performance.

---

## 📱 PWA — Progressive Web App

### manifest.webmanifest
- `display: "standalone"` — abre como app nativo
- `theme_color: #1B4F72` — cor da status bar
- `start_url: "/"` — URL de entrada

### ngsw-config.json (Service Worker)
- **Cache de assets** — arquivos JS/CSS/fontes cacheados no install
- **Cache lazy** — imagens e assets secundários carregados sob demanda
- Estratégia `freshness` para dados de API (quando conectado a backend)

### Habilitação automática
```typescript
// app.config.ts
provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),   // Ativo apenas em produção
  registrationStrategy: 'registerWhenStable:30000'
})
```

---

## 📐 Layout Responsivo

| Breakpoint | Comportamento |
|-----------|---------------|
| > 768px (Desktop) | Sidebar fixa (260px) + conteúdo ao lado |
| ≤ 768px (Mobile) | Sidebar vira drawer (off-canvas) com overlay + botão hamburger |

Grids adaptativos:
- `grid-2` → 1 coluna no mobile
- `grid-4` → 1 coluna no mobile  
- `form-row` → 1 coluna no mobile

---

## 🛠️ Como Rodar

### Pré-requisitos
- Node.js 18+
- npm 9+
- Angular CLI 17

```bash
# Instalar Angular CLI globalmente
npm install -g @angular/cli@17

# Instalar dependências
npm install

# Servidor de desenvolvimento (http://localhost:4200)
ng serve

# Build de produção (com PWA ativo)
ng build --configuration production

# Servir build de produção localmente
npx http-server dist/bibliotheca/browser -p 8080
```

---

## 🧪 Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Angular | 17.x | Framework principal |
| Angular Router | 17.x | Navegação SPA |
| Angular Service Worker | 17.x | PWA / Cache offline |
| Angular Signals | 17.x | Estado reativo (`signal()`) |
| TypeScript | 5.2 | Tipagem estática |
| CSS Variables | — | Design system |
| DM Sans + DM Serif Display | — | Tipografia (Google Fonts) |
| Material Icons | — | Ícones (Google) |

---

## 🎨 Design System

O projeto usa **CSS Custom Properties** (variáveis) para consistência:

```css
:root {
  --md-primary: #1B4F72;      /* Azul principal */
  --md-secondary: #117A65;    /* Verde ações */
  --md-error: #C0392B;        /* Vermelho erros/multas */
  --md-surface: #F8FAFB;      /* Background */
  --radius-md: 12px;          /* Border radius padrão */
  --shadow-md: 0 4px 12px ... /* Sombra padrão */
}
```

---

## 📝 Padrões Angular 17 Utilizados

- **Standalone Components** — sem NgModule
- **`@if` / `@for`** — nova sintaxe de controle de fluxo
- **Signals** — `signal()` para estado reativo
- **Lazy Loading** — `loadComponent()` em todas as rotas
- **Inject function** — `inject()` ao invés de constructor injection
- **`provideRouter`** — configuração funcional sem módulos
