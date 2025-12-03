# Bazina Tasker - Dokumentace vývoje

## Přehled projektu

**Název:** Bazina Tasker
**Popis:** Webová aplikace pro správu zákazníků a poznámek z jednání
**Účel:** Evidence zákazníků, zápis poznámek ze schůzek, ukládání příloh (fotky, PDF, dokumenty)

---

## Tech Stack

| Vrstva | Technologie | Účel |
|--------|-------------|------|
| Frontend | React 18 + Vite | UI framework |
| UI Kit | CoreUI React | Admin šablona + komponenty |
| Styling | CoreUI + SCSS | Responzivní design (Bootstrap based) |
| Ikony | CoreUI Icons | Ikonový set |
| Rich Text | TipTap | Editor poznámek |
| Backend | Supabase | BaaS platforma |
| Databáze | PostgreSQL (Supabase) | Ukládání dat |
| Autentizace | Supabase Auth | Email + Google SSO |
| Úložiště | Supabase Storage | Soubory a média |
| Hosting Frontend | Vercel | Deployment |
| Hosting Backend | Supabase Cloud | Managed service |

### CoreUI - co využijeme

CoreUI poskytuje hotové komponenty, které využijeme:

| Komponenta | Použití |
|------------|---------|
| CSidebar | Boční navigace |
| CHeader | Hlavička aplikace |
| CCard | Karty pro zákazníky, poznámky |
| CTable | Tabulky se zákazníky |
| CForm, CFormInput | Formuláře |
| CModal | Dialogová okna |
| CBadge | Štítky, tagy, statusy |
| CButton | Tlačítka |
| CDropdown | Dropdown menu |
| CSpinner | Loading stavy |
| CToast | Notifikace |
| CPagination | Stránkování |
| CBreadcrumb | Drobečková navigace |
| CAlert | Upozornění |

---

## Datový model

### Tabulka: users (spravuje Supabase Auth)
```sql
- id: UUID (PK)
- email: VARCHAR
- created_at: TIMESTAMP
```

### Tabulka: profiles
```sql
- id: UUID (PK, FK -> auth.users)
- email: VARCHAR
- full_name: VARCHAR
- avatar_url: VARCHAR
- theme_preference: VARCHAR(10) DEFAULT 'light' ('light' | 'dark')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabulka: customers
```sql
- id: UUID (PK)
- user_id: UUID (FK -> profiles)
- name: VARCHAR (jméno kontaktní osoby)
- company: VARCHAR (název firmy)
- email: VARCHAR
- phone: VARCHAR
- address: TEXT
- notes: TEXT (obecné poznámky k zákazníkovi)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabulka: tags
```sql
- id: UUID (PK)
- user_id: UUID (FK -> profiles)
- name: VARCHAR
- color: VARCHAR (hex barva)
- created_at: TIMESTAMP
```

### Tabulka: notes
```sql
- id: UUID (PK)
- user_id: UUID (FK -> profiles)
- customer_id: UUID (FK -> customers)
- title: VARCHAR
- content: TEXT (rich text JSON)
- meeting_date: DATE
- meeting_type: ENUM ('in_person', 'phone', 'video', 'email')
- status: ENUM ('draft', 'completed', 'requires_action')
- priority: ENUM ('low', 'medium', 'high')
- follow_up_date: DATE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabulka: note_tags (M:N vazba)
```sql
- note_id: UUID (FK -> notes)
- tag_id: UUID (FK -> tags)
- PRIMARY KEY (note_id, tag_id)
```

### Tabulka: note_tasks
```sql
- id: UUID (PK)
- note_id: UUID (FK -> notes)
- text: VARCHAR
- is_completed: BOOLEAN
- order: INTEGER
- created_at: TIMESTAMP
```

### Tabulka: attachments
```sql
- id: UUID (PK)
- note_id: UUID (FK -> notes)
- user_id: UUID (FK -> profiles)
- filename: VARCHAR
- file_url: VARCHAR
- file_type: VARCHAR (MIME type)
- file_size: INTEGER (bytes)
- created_at: TIMESTAMP
```

### Tabulka: note_time_entries
```sql
- id: UUID (PK)
- note_id: UUID (FK -> notes)
- user_id: UUID (FK -> profiles)
- duration_minutes: INTEGER (> 0)
- description: VARCHAR(255)
- entry_date: DATE
- created_at: TIMESTAMP
```

### Tabulka: customer_attachments
```sql
- id: UUID (PK)
- customer_id: UUID (FK -> customers)
- user_id: UUID (FK -> profiles)
- filename: VARCHAR(255)
- file_url: TEXT
- file_type: VARCHAR(100)
- file_size: INTEGER
- description: VARCHAR(255)
- created_at: TIMESTAMP
```

### Tabulka: audit_log
```sql
- id: UUID (PK)
- table_name: TEXT
- record_id: UUID
- action: TEXT ('INSERT', 'UPDATE', 'DELETE', 'attachment_added', 'attachment_removed', 'task_added', 'task_removed', 'time_entry_added', 'time_entry_removed')
- old_values: JSONB
- new_values: JSONB
- changed_fields: TEXT[]
- user_id: UUID (FK -> auth.users)
- created_at: TIMESTAMP
```

---

## Struktura projektu

```
bazina-tasker/
├── doc/
│   └── documentation.md
├── src/
│   ├── components/
│   │   ├── layout/                # Layout komponenty (CoreUI based)
│   │   │   ├── AppHeader.jsx      # CHeader wrapper
│   │   │   ├── AppSidebar.jsx     # CSidebar wrapper
│   │   │   ├── AppFooter.jsx      # Patička
│   │   │   ├── AppBreadcrumb.jsx  # Drobečková navigace
│   │   │   └── DefaultLayout.jsx  # Hlavní layout wrapper
│   │   ├── auth/                  # Autentizace
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── GoogleButton.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── customers/             # Zákazníci
│   │   │   ├── CustomerList.jsx
│   │   │   ├── CustomerCard.jsx
│   │   │   ├── CustomerForm.jsx
│   │   │   ├── CustomerDetail.jsx
│   │   │   └── CustomerSearch.jsx
│   │   ├── notes/                 # Poznámky
│   │   │   ├── NoteList.jsx
│   │   │   ├── NoteCard.jsx
│   │   │   ├── NoteForm.jsx
│   │   │   ├── NoteDetail.jsx
│   │   │   ├── NoteEditor.jsx     # TipTap editor
│   │   │   ├── NoteFilters.jsx
│   │   │   └── NoteTasks.jsx
│   │   ├── tags/                  # Tagy
│   │   │   ├── TagList.jsx
│   │   │   ├── TagBadge.jsx
│   │   │   ├── TagSelector.jsx
│   │   │   └── TagForm.jsx
│   │   ├── attachments/           # Přílohy
│   │   │   ├── AttachmentList.jsx
│   │   │   ├── AttachmentUpload.jsx
│   │   │   ├── AttachmentPreview.jsx
│   │   │   └── FileIcon.jsx
│   │   ├── dashboard/             # Dashboard komponenty
│   │   │   └── DashboardCharts.jsx
│   │   ├── common/                # Sdílené komponenty
│   │   │   └── AuditHistory.jsx
│   │   └── time/                  # Časové záznamy
│   │       └── TimeEntryModal.jsx
│   ├── views/                     # Stránky (CoreUI konvence)
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── customers/
│   │   │   ├── Customers.jsx
│   │   │   └── CustomerDetail.jsx
│   │   ├── notes/
│   │   │   ├── Notes.jsx
│   │   │   └── NoteDetail.jsx
│   │   ├── tags/
│   │   │   └── Tags.jsx
│   │   └── settings/
│   │       └── Settings.jsx
│   ├── hooks/                     # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useCustomers.js
│   │   ├── useNotes.js
│   │   ├── useTags.js
│   │   ├── useAttachments.js
│   │   ├── useTimeEntries.js
│   │   ├── useAuditLog.js
│   │   ├── useDashboardStats.js
│   │   └── useDebounce.js
│   ├── lib/
│   │   ├── supabase.js           # Supabase client
│   │   └── utils.js              # Helper funkce
│   ├── context/
│   │   └── AuthContext.jsx       # Auth context provider
│   ├── scss/                      # SCSS styly (CoreUI + vlastní)
│   │   ├── style.scss            # Hlavní SCSS soubor (importy)
│   │   ├── _variables.scss       # Přepsání CoreUI proměnných + vlastní
│   │   ├── _custom.scss          # Vlastní globální styly
│   │   └── components/           # SCSS pro specifické komponenty
│   │       ├── _customers.scss
│   │       ├── _notes.scss
│   │       └── _editor.scss
│   ├── _nav.jsx                   # Definice navigace pro sidebar
│   ├── routes.jsx                 # Definice routes
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── migrations/               # SQL migrace
│   │   ├── 001_create_profiles.sql
│   │   ├── 002_create_customers.sql
│   │   ├── 003_create_tags.sql
│   │   ├── 004_create_notes.sql
│   │   ├── 005_create_note_tags.sql
│   │   ├── 006_create_note_tasks.sql
│   │   ├── 007_create_attachments.sql
│   │   ├── 007_add_archived_status.sql
│   │   ├── 008_create_storage.sql
│   │   ├── 009_create_time_entries.sql
│   │   ├── 010_create_customer_attachments.sql
│   │   ├── 011_add_theme_preference.sql
│   │   ├── 012_create_audit_log.sql
│   │   └── 013_audit_attachments_time.sql
│   └── seed.sql                  # Testovací data
├── public/
│   └── favicon.ico
├── .env.example
├── .env.local                    # Lokální environment (gitignore)
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## Fáze vývoje

### FÁZE 1: Inicializace projektu ✅
**Cíl:** Základní kostra projektu připravená k vývoji

#### 1.1 Vytvoření React projektu s CoreUI
- [x] Inicializace Vite + React
- [x] Instalace CoreUI React (@coreui/react, @coreui/coreui)
- [x] Instalace CoreUI Icons (@coreui/icons, @coreui/icons-react)
- [x] Instalace dalších závislostí (react-router-dom, sass)
- [x] Nastavení SCSS struktury
- [x] Nastavení struktury složek podle CoreUI konvencí
- [x] Konfigurace ESLint + Prettier

#### 1.2 Nastavení Supabase
- [x] Vytvoření Supabase projektu (supabase.com)
- [x] Získání API klíčů
- [x] Konfigurace environment variables
- [x] Inicializace Supabase klienta v projektu

#### 1.3 Git repozitář
- [x] Inicializace git
- [x] Vytvoření .gitignore
- [x] První commit

---

### FÁZE 2: Autentizace ✅
**Cíl:** Funkční přihlášení a registrace

#### 2.1 Supabase Auth konfigurace
- [x] Povolení Email/Password auth
- [x] Konfigurace Google OAuth provider
- [x] Nastavení redirect URLs

#### 2.2 Frontend autentizace
- [x] AuthContext provider
- [x] useAuth hook
- [x] LoginPage s formulářem
- [x] RegisterPage s formulářem
- [x] Google SSO tlačítko
- [x] ProtectedRoute komponenta
- [x] Logout funkcionalita

#### 2.3 Profily uživatelů
- [x] SQL migrace pro profiles tabulku
- [x] Trigger pro automatické vytvoření profilu
- [x] Row Level Security (RLS) policies

---

### FÁZE 3: Layout a navigace (CoreUI) ✅
**Cíl:** Základní struktura UI pomocí CoreUI komponent

#### 3.1 Layout komponenty
- [x] DefaultLayout.jsx (hlavní wrapper s CSidebar + CHeader)
- [x] AppHeader.jsx (CHeader - logo, uživatel, logout dropdown)
- [x] AppSidebar.jsx (CSidebar - navigace)
- [x] AppFooter.jsx (patička)
- [x] AppBreadcrumb.jsx (drobečková navigace)

#### 3.2 Navigace a routing
- [x] _nav.jsx (definice položek navigace pro sidebar)
- [x] routes.jsx (definice všech routes)
- [x] React Router konfigurace v App.jsx
- [x] Aktivní stavy navigace (automaticky CoreUI)

#### 3.3 Základní nastavení CoreUI
- [x] Import CoreUI stylů v main.jsx
- [x] Nastavení SCSS proměnných (_variables.scss)
- [x] Vlastní úpravy stylů (_custom.scss)
- [x] Responzivní sidebar (automaticky CoreUI)

**Poznámka:** UI komponenty (Button, Input, Modal, Card, Badge, Spinner, Dropdown) používáme přímo z CoreUI - není třeba vytvářet vlastní.

---

### FÁZE 4: Správa zákazníků ✅
**Cíl:** CRUD operace pro zákazníky

#### 4.1 Databáze
- [x] SQL migrace pro customers tabulku
- [x] RLS policies (uživatel vidí pouze své zákazníky)
- [x] Indexy pro vyhledávání

#### 4.2 Backend integrace
- [x] useCustomers hook
  - [x] fetchCustomers (list)
  - [x] fetchCustomer (detail)
  - [x] createCustomer
  - [x] updateCustomer
  - [x] deleteCustomer
  - [x] searchCustomers

#### 4.3 Frontend komponenty
- [x] CustomersPage (seznam zákazníků)
- [x] CustomerList (tabulka/grid)
- [x] CustomerCard (karta zákazníka)
- [x] CustomerForm (vytvoření/úprava)
- [x] CustomerDetail (detail zákazníka)
- [x] CustomerSearch (vyhledávání + filtry)
- [x] Potvrzovací dialog pro mazání

---

### FÁZE 5: Správa tagů ✅
**Cíl:** Možnost vytvářet a spravovat tagy

#### 5.1 Databáze
- [x] SQL migrace pro tags tabulku
- [x] RLS policies

#### 5.2 Backend integrace
- [x] useTags hook
  - [x] fetchTags
  - [x] createTag
  - [x] updateTag
  - [x] deleteTag

#### 5.3 Frontend komponenty
- [x] TagsPage (správa tagů)
- [x] TagList
- [x] TagBadge (zobrazení tagu)
- [x] TagSelector (výběr tagů pro poznámku)
- [x] TagForm (vytvoření/úprava s výběrem barvy)

---

### FÁZE 6: Správa poznámek ✅
**Cíl:** CRUD operace pro poznámky s rich text editorem

#### 6.1 Databáze
- [x] SQL migrace pro notes tabulku
- [x] SQL migrace pro note_tags (M:N vazba)
- [x] SQL migrace pro note_tasks
- [x] RLS policies
- [x] Full-text search index

#### 6.2 Rich Text Editor
- [x] Instalace TipTap
- [x] NoteEditor komponenta
- [x] Toolbar (bold, italic, lists, headings)
- [x] Serializace/deserializace obsahu

#### 6.3 Backend integrace
- [x] useNotes hook
  - [x] fetchNotes (s filtrováním)
  - [x] fetchNote (detail)
  - [x] createNote
  - [x] updateNote
  - [x] deleteNote
  - [x] searchNotes
  - [x] fetchNotesByCustomer

#### 6.4 Frontend komponenty
- [x] NotesPage (seznam poznámek)
- [x] NoteList
- [x] NoteCard (náhled poznámky)
- [x] NoteForm (vytvoření/úprava)
- [x] NoteDetail (zobrazení poznámky)
- [x] NoteFilters (typ, status, priorita, datum, tagy)
- [x] NoteTasks (checkbox seznam úkolů)

---

### FÁZE 7: Přílohy a média ✅
**Cíl:** Upload a správa souborů

#### 7.1 Supabase Storage
- [x] Vytvoření storage bucket "attachments"
- [x] Konfigurace policies (přístup pouze vlastník)
- [x] Nastavení MIME types a size limits

#### 7.2 Databáze
- [x] SQL migrace pro attachments tabulku
- [x] SQL migrace pro customer_attachments tabulku
- [x] RLS policies

#### 7.3 Backend integrace
- [x] useAttachments hook
  - [x] uploadFile
  - [x] deleteFile
  - [x] getFileUrl
  - [x] fetchAttachments

#### 7.4 Frontend komponenty
- [x] AttachmentUpload (drag & drop + click)
- [x] AttachmentList (seznam příloh)
- [x] AttachmentPreview (náhled obrázků, PDF ikona)
- [x] FileIcon (ikony podle typu souboru)
- [x] Progress bar pro upload
- [x] Lightbox pro obrázky

---

### FÁZE 8: Dashboard a přehledy ✅
**Cíl:** Úvodní stránka s přehledem

#### 8.1 Dashboard komponenty
- [x] Statistiky (počet zákazníků, poznámek)
- [x] Nedávné poznámky
- [x] Nadcházející follow-upy
- [x] Poznámky vyžadující akci
- [x] Rychlé akce (nový zákazník, nová poznámka)
- [x] Grafy statistik (poznámky za týden, čas podle zákazníka, typy poznámek, aktivita)

#### 8.2 Kalendářní přehled
- [x] Seznam follow-upů podle data
- [x] Barevné označení priority

---

### FÁZE 9: Vyhledávání a filtry ✅
**Cíl:** Globální vyhledávání a pokročilé filtry

#### 9.1 Globální vyhledávání
- [x] Search komponenta v headeru
- [x] Vyhledávání napříč zákazníky a poznámkami
- [x] Debounced input
- [x] Dropdown s výsledky

#### 9.2 Pokročilé filtry
- [x] Filtrování poznámek podle více kritérií
- [ ] Uložení filtrů do URL (sdílení)
- [x] Reset filtrů

---

### FÁZE 10: Nastavení a profil ✅
**Cíl:** Správa uživatelského účtu

#### 10.1 Stránka nastavení
- [x] Úprava profilu (jméno, avatar)
- [x] Změna hesla
- [x] Přepínání motivu (light/dark)
- [ ] Nastavení notifikací (připrava pro budoucnost)

#### 10.2 Export dat
- [ ] Export zákazníků do CSV
- [ ] Export poznámek do PDF (volitelné)

---

### FÁZE 11: Responzivita a UX ✅
**Cíl:** Plně responzivní aplikace (CoreUI je již responzivní)

#### 11.1 Mobile optimalizace
- [x] Testování na různých zařízeních
- [x] Úprava breakpointů pokud potřeba
- [x] Optimalizace tabulek pro mobil (CTable responsive)
- [x] Testování sidebar chování na mobilu

#### 11.2 UX vylepšení
- [x] Loading states všude (CSpinner)
- [x] Error handling a zobrazení chyb (CAlert)
- [x] Toast notifikace (CToast, CToaster)
- [ ] Skeleton loading (CPlaceholder)
- [x] Empty states (žádná data)

---

### FÁZE 12: Evidence času ✅
**Cíl:** Sledování stráveného času na poznámkách

#### 12.1 Databáze
- [x] SQL migrace pro note_time_entries tabulku
- [x] RLS policies

#### 12.2 Backend integrace
- [x] useTimeEntries hook
  - [x] fetchTimeEntries
  - [x] addTimeEntry
  - [x] deleteTimeEntry

#### 12.3 Frontend komponenty
- [x] TimeEntryModal (přidání záznamu)
- [x] TimeEntryList (seznam záznamů)
- [x] Zobrazení celkového času v přehledu poznámek
- [x] Dashboard graf času podle zákazníků

---

### FÁZE 13: Audit log ✅
**Cíl:** Historie změn pro poznámky a zákazníky

#### 13.1 Databáze
- [x] SQL migrace pro audit_log tabulku
- [x] Trigger funkce pro automatické logování
- [x] Triggery pro notes, customers, tags, note_tasks
- [x] Triggery pro attachments a time_entries
- [x] RLS policies

#### 13.2 Backend integrace
- [x] useAuditLog hook
  - [x] fetchAuditLog

#### 13.3 Frontend komponenty
- [x] AuditHistory komponenta
- [x] Zobrazení v detailu poznámky a zákazníka
- [x] Formátování změn a akcí

---

### FÁZE 14: Testování a optimalizace
**Cíl:** Stabilní a rychlá aplikace

#### 14.1 Testování
- [x] Manuální testování všech funkcí
- [x] Testování na různých prohlížečích
- [ ] Testování na mobilních zařízeních

#### 14.2 Optimalizace
- [ ] Lazy loading stránek
- [ ] Optimalizace obrázků
- [ ] Caching strategií
- [ ] Bundle size analýza

---

### FÁZE 15: Deployment
**Cíl:** Produkční nasazení

#### 15.1 Příprava
- [ ] Environment variables pro produkci
- [ ] Build optimalizace
- [ ] Error tracking (Sentry - volitelné)

#### 15.2 Deployment
- [ ] Nasazení na Vercel
- [ ] Konfigurace vlastní domény (volitelné)
- [ ] SSL certifikát (automaticky)
- [ ] Testování produkce

---

## Environment Variables

```env
# .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

---

## Závislosti (package.json)

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",

    "@coreui/react": "^5.x",
    "@coreui/coreui": "^5.x",
    "@coreui/icons": "^3.x",
    "@coreui/icons-react": "^2.x",

    "@supabase/supabase-js": "^2.x",

    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",

    "date-fns": "^3.x",
    "classnames": "^2.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "sass": "^1.x",
    "@vitejs/plugin-react": "^4.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

---

## Poznámky k vývoji

### Konvence pojmenování
- Komponenty: PascalCase (CustomerList.jsx)
- Views (stránky): PascalCase v složkách podle domény (views/customers/Customers.jsx)
- Hooks: camelCase s prefixem "use" (useCustomers.js)
- Utility funkce: camelCase (formatDate.js)
- SCSS soubory: snake_case s prefixem _ pro partials (_custom.scss)

### SASS/SCSS pravidla

**Veškeré vlastní styly se píší výhradně v SASS/SCSS formátu.**

#### Struktura SCSS souborů
```
src/scss/
├── style.scss              # Hlavní soubor - importy
├── _variables.scss         # Přepsání CoreUI proměnných + vlastní proměnné
├── _custom.scss            # Vlastní globální styly
└── components/             # Styly pro konkrétní komponenty (pokud potřeba)
    ├── _customers.scss
    ├── _notes.scss
    └── _editor.scss
```

#### Pravidla pro psaní SCSS
1. **Používat CoreUI utility třídy** kde to jde (spacing, colors, flexbox)
2. **Vlastní styly** jen když CoreUI nestačí
3. **BEM metodologie** pro vlastní třídy (block__element--modifier)
4. **Nesting** max 3 úrovně
5. **Proměnné** pro barvy, spacing, breakpointy

#### Příklad SCSS
```scss
// _variables.scss - přepsání CoreUI proměnných
$primary: #3b82f6;
$sidebar-bg: #1e293b;

// Vlastní proměnné
$note-card-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

// _custom.scss - vlastní styly
.note-card {
  box-shadow: $note-card-shadow;

  &__header {
    border-bottom: 1px solid var(--cui-border-color);
  }

  &__content {
    padding: map-get($spacers, 3);
  }

  &--highlighted {
    border-left: 3px solid $primary;
  }
}
```

#### Co NEPOUŽÍVAT
- Inline styly v JSX (kromě dynamických hodnot)
- Čisté CSS soubory
- CSS-in-JS knihovny (styled-components, emotion)
- Tailwind utility třídy

### Git workflow
- main branch: produkční kód
- develop branch: vývojová větev
- feature/xxx: nové funkce
- fix/xxx: opravy bugů

### Commit messages
- feat: nová funkcionalita
- fix: oprava bugu
- docs: dokumentace
- style: formátování
- refactor: refaktoring kódu

---

## Budoucí rozšíření (mimo scope)

- [ ] Multi-tenant (více uživatelů, týmy)
- [ ] Notifikace (email, push)
- [ ] Integrace s kalendářem (Google Calendar)
- [ ] API pro externí systémy
- [ ] Mobilní aplikace (React Native)
- [ ] Offline podpora (PWA)
- [ ] AI asistent pro sumarizaci poznámek

---

## Aktuální stav projektu

**Poslední aktualizace:** 2024-12-03

### Dokončené fáze (13/15)
| Fáze | Název | Stav |
|------|-------|------|
| 1 | Inicializace projektu | ✅ Dokončeno |
| 2 | Autentizace | ✅ Dokončeno |
| 3 | Layout a navigace | ✅ Dokončeno |
| 4 | Správa zákazníků | ✅ Dokončeno |
| 5 | Správa tagů | ✅ Dokončeno |
| 6 | Správa poznámek | ✅ Dokončeno |
| 7 | Přílohy a média | ✅ Dokončeno |
| 8 | Dashboard a přehledy | ✅ Dokončeno |
| 9 | Vyhledávání a filtry | ✅ Dokončeno |
| 10 | Nastavení a profil | ✅ Dokončeno |
| 11 | Responzivita a UX | ✅ Dokončeno |
| 12 | Evidence času | ✅ Dokončeno |
| 13 | Audit log | ✅ Dokončeno |
| 14 | Testování a optimalizace | 🔄 Částečně |
| 15 | Deployment | ⏳ Čeká |

### Klíčové funkce aplikace
- **Správa zákazníků** - CRUD operace, vyhledávání, přílohy
- **Poznámky ze schůzek** - Rich text editor, tagy, úkoly, přílohy
- **Evidence času** - Sledování stráveného času na poznámkách
- **Dashboard** - Statistiky, grafy, nadcházející úkoly
- **Audit log** - Historie všech změn
- **Autentizace** - Email/heslo, Google SSO
- **Dark mode** - Přepínání motivu
