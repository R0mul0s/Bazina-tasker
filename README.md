# Bazina Tasker

Webová aplikace pro správu zákazníků a poznámek z jednání. Umožňuje evidenci zákazníků, zápis poznámek ze schůzek, sledování stráveného času a ukládání příloh.

## Funkce

- **Správa zákazníků** - CRUD operace, vyhledávání, přílohy k zákazníkům
- **Poznámky ze schůzek** - Rich text editor (TipTap), tagy, úkoly s checkboxy, přílohy
- **Evidence času** - Sledování stráveného času na poznámkách s grafy
- **Dashboard** - Statistiky, grafy aktivit, nadcházející follow-upy
- **Audit log** - Kompletní historie změn všech záznamů
- **Autentizace** - Email/heslo a Google SSO
- **Dark mode** - Přepínání světlého a tmavého motivu

## Tech Stack

| Vrstva | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite |
| UI Kit | CoreUI React |
| Styling | SCSS (Bootstrap based) |
| Rich Text | TipTap |
| Backend | Supabase (BaaS) |
| Databáze | PostgreSQL |
| Autentizace | Supabase Auth |
| Úložiště | Supabase Storage |

## Požadavky

- Node.js 18+
- npm nebo yarn
- Supabase účet (pro backend)

## Instalace

1. **Klonování repozitáře**

```bash
git clone https://github.com/your-username/bazina-tasker.git
cd bazina-tasker
```

2. **Instalace závislostí**

```bash
npm install
```

3. **Konfigurace environment variables**

Vytvořte soubor `.env.local` v kořenovém adresáři:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Hodnoty získáte v Supabase dashboardu: Project Settings → API

4. **Nastavení databáze**

Spusťte SQL migrace v Supabase SQL editoru v pořadí:
- `supabase/migrations/001_create_profiles.sql`
- `supabase/migrations/002_create_customers.sql`
- ... (všechny migrace 001-013)

Alternativně použijte Supabase CLI:

```bash
supabase db push
```

5. **Konfigurace Supabase Auth**

V Supabase dashboardu:
- Authentication → Providers → zapněte Email a Google
- Authentication → URL Configuration → nastavte Site URL a Redirect URLs

## Spuštění

### Development

```bash
npm run dev
```

Aplikace poběží na `http://localhost:5173`

### Production build

```bash
npm run build
```

Build bude v adresáři `dist/`

### Preview production buildu

```bash
npm run preview
```

## Struktura projektu

```
bazina-tasker/
├── doc/                    # Dokumentace
├── src/
│   ├── components/         # React komponenty
│   │   ├── layout/         # Layout (sidebar, header)
│   │   ├── customers/      # Zákazníci
│   │   ├── notes/          # Poznámky
│   │   ├── tags/           # Tagy
│   │   ├── attachments/    # Přílohy
│   │   ├── dashboard/      # Dashboard grafy
│   │   └── common/         # Sdílené komponenty
│   ├── views/              # Stránky
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility funkce
│   ├── context/            # React context
│   └── scss/               # SCSS styly
├── supabase/
│   └── migrations/         # SQL migrace
└── public/                 # Statické soubory
```

## Dostupné skripty

| Příkaz | Popis |
|--------|-------|
| `npm run dev` | Spustí vývojový server |
| `npm run build` | Vytvoří production build |
| `npm run preview` | Spustí preview production buildu |
| `npm run lint` | Spustí ESLint |

## Databázové migrace

Migrace jsou v adresáři `supabase/migrations/`:

| Soubor | Popis |
|--------|-------|
| 001_create_profiles.sql | Profily uživatelů |
| 002_create_customers.sql | Zákazníci |
| 003_create_tags.sql | Tagy |
| 004_create_notes.sql | Poznámky |
| 005_create_note_tags.sql | M:N vazba poznámky-tagy |
| 006_create_note_tasks.sql | Úkoly v poznámkách |
| 007_create_attachments.sql | Přílohy poznámek |
| 008_create_storage.sql | Storage bucket |
| 009_create_time_entries.sql | Evidence času |
| 010_create_customer_attachments.sql | Přílohy zákazníků |
| 011_add_theme_preference.sql | Preference motivu |
| 012_create_audit_log.sql | Audit log |
| 013_audit_attachments_time.sql | Rozšíření audit logu |

## Dokumentace

Podrobná dokumentace je v souboru [doc/documentation.md](doc/documentation.md).

## Licence

MIT
