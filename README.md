# MyMind

Osobisty, jednoużytkownikowy „second brain" — magazyn informacji o mnie. Chodzi lokalnie
na Raspberry Pi 5 w sieci domowej. **Bez autoryzacji i bez zewnętrznych integracji** —
v1 zakłada, że dostęp do sieci domowej to wystarczająca granica.

## Stack

| Warstwa    | Wybór                                                      |
| ---------- | ---------------------------------------------------------- |
| Framework  | Next.js 15 (App Router), TypeScript strict                  |
| Mutacje    | Server Actions (bez osobnej warstwy API)                    |
| Baza       | PostgreSQL 17 przez Drizzle ORM + `pg` (node-postgres)       |
| Migracje   | drizzle-kit, aplikowane automatycznie przy starcie serwera   |
| Dane       | nazwany wolumen Dockera `mymind-pgdata`                      |
| Walidacja  | zod                                                        |
| Języki     | polski i angielski (przełącznik PL/EN w topbarze)           |
| Deployment | Docker multi-stage, ARM64, `output: 'standalone'`           |

## Zakładki

| Zakładka  | Route        | Tabele                          | Co robi |
| --------- | ------------ | ------------------------------- | ------- |
| Pulpit    | `/`          | — (czyta z innych)              | Powitanie, leki na dziś z odhaczaniem, ostatni wpis z pamiętnika, skrót profilu |
| Profil    | `/profil`    | `profile`                       | Imię, data urodzenia (wiek liczony w locie), waga, wzrost, grupa krwi, alergie, choroby przewlekłe, ubezpieczenie, PESEL (maskowany, „Pokaż"). Jeden wiersz `id = 1`, upsert |
| Pamiętnik | `/dziennik`  | `journal_entries`               | Wpisy z datą i nastrojem 1–5, wiele na dzień, malejąco po dacie, pełny CRUD |
| Aktywność | `/aktywnosc` | `activity_days`, `workouts`     | Kroki, sen, kalorie na dzień (upsert po dacie), słupki kroków Pn–Nd, lista aktywności (spacer, bieg, siłownia…) |
| Leki      | `/leki`      | `medications`, `medication_logs` | Leki z porami (rano / południe / wieczór), checkbox na każdą porę, „Zakończ branie", historia tygodnia |
| Notatki   | `/notatki`   | `notes`                         | Tytuł (opcjonalny) + treść, przypinanie, siatka kart, pełny CRUD |
| Projekty  | `/projekty`  | `projects`, `project_tasks`     | Status, opis, termin, linki, lista zadań z postępem, pełny CRUD |
| Kalendarz | `/kalendarz` | `events`                        | Siatka miesiąca z kropkami kategorii, wydarzenia wybranego dnia, „Nadchodzące" |
| Zadania   | `/zadania`   | `todos`                         | To-do z priorytetem (klik zmienia), terminem, filtrami Wszystkie / Aktywne / Zrobione |

### Leki: reset o północy bez crona

Stan checkboxa to „czy w `medication_logs` jest wiersz `(lek, dzisiejsza data, pora)`
z `taken = true`". Kliknięcie robi jeden atomowy upsert tego wiersza
(`ON CONFLICT … DO UPDATE SET taken = NOT taken`), więc szybki podwójny klik nie rozjedzie stanu. Nowy dzień = brak wiersza =
odznaczone — nic nie trzeba resetować, a historia zostaje w bazie i zasila siatkę tygodnia
(pełne kółko = wszystkie pory, obwódka = część, szare = nic).

### Aktywność: wpisy ręczne

W designie dane szły z Google Health. v1 nie ma zewnętrznych integracji, więc kroki, sen
i kalorie wpisuje się ręcznie (formularz „Statystyki dnia"). Cele dzienne (10 000 kroków,
8 h snu, 2 500 kcal) są stałymi w [`src/app/aktywnosc/queries.ts`](src/app/aktywnosc/queries.ts).
Integracja z zegarkiem to naturalny kandydat na v2 — wystarczy, że będzie upsertować
wiersze do `activity_days` i `workouts`.

## Uruchomienie w trybie deweloperskim

Aplikacja chodzi na hoście, a Postgres w Dockerze (ten sam z `docker-compose.yml`,
wystawiony tylko na `127.0.0.1:5432`):

```bash
npm install
```

```bash
docker compose up -d db
```

```bash
npm run dev
```

Aplikacja stoi na http://localhost:3000. Przy starcie serwer sam stosuje migracje —
nie trzeba nic odpalać ręcznie. Bez pliku `.env` aplikacja łączy się z
`postgres://mymind:mymind@localhost:5432/mymind`; własne hasło ustawiasz w `.env`
(wzór w [`.env.example`](.env.example)) — czytają go i Next, i docker compose, i skrypty `db:*`.

| Skrypt                | Co robi                                                      |
| --------------------- | ------------------------------------------------------------ |
| `npm run dev`         | Serwer deweloperski                                           |
| `npm run build`       | Build produkcyjny (sprawdza też typy)                         |
| `npm run typecheck`   | Sam `tsc --noEmit`                                            |
| `npm run db:generate` | Generuje plik migracji z `src/db/schema.ts`                   |
| `npm run db:migrate`  | Ręcznie aplikuje migracje (zwykle zbędne — patrz niżej)       |
| `npm run db:inspect`  | Liczba migracji i wierszy w każdej tabeli                     |
| `npm run db:studio`   | Drizzle Studio — przeglądarka bazy                            |

## Docker na Raspberry Pi

Na Pi (ARM64) budujesz natywnie — `node:22-bookworm-slim` to obraz multi-arch,
więc ten sam `Dockerfile` działa i na Pi, i na amd64:

```bash
docker compose up -d --build
```

Wstają dwa kontenery: `mymind` (port 3000) i `mymind-db` (Postgres 17, oficjalny
obraz multi-arch). Aplikacja czeka, aż baza przejdzie healthcheck, a przy starcie
sama stosuje migracje. Oba restartują się z `unless-stopped`.

Dane leżą w nazwanym wolumenie `mymind-pgdata`, więc **przetrwają przebudowę obrazów
i `docker compose down`**. Znikają dopiero przy `docker compose down -v` — tej flagi
nie używaj na Pi, chyba że naprawdę chcesz zacząć od zera.

Postgres nie jest wystawiony na sieć domową — port 5432 słucha tylko na `127.0.0.1`
hosta. Przed pierwszym startem na Pi skopiuj `.env.example` do `.env` i ustaw własne
hasło: Postgres czyta je tylko przy inicjalizacji pustego wolumenu.

Build potrzebuje internetu (npm i fonty z Google Fonts, które `next/font` wkleja do obrazu)
— działająca aplikacja już nie. Zależności są czystym JS-em, więc obraz nie potrzebuje
kompilatora i buduje się na Pi szybko.

```bash
docker compose logs -f
```

```bash
docker compose down
```

Budowanie na mocniejszej maszynie i przeniesienie obrazu na Pi:

```bash
docker buildx build --platform linux/arm64 -t mymind:latest --load .
```

### Strefa czasowa

`docker-compose.yml` ustawia `TZ=Europe/Warsaw`. To nie jest kosmetyka: „dzisiaj"
w Lekach, Pulpicie, Aktywności i Kalendarzu liczy się w lokalnej strefie serwera,
więc od `TZ` zależy, o której godzinie przeskakuje nowy dzień.

### Kopia zapasowa

`pg_dump` robi spójną kopię działającej bazy — nie trzeba niczego zatrzymywać:

```bash
docker compose exec -T db pg_dump -U mymind -d mymind --format=custom > mymind-backup.dump
```

Odtworzenie (nadpisuje obecne dane):

```bash
docker compose exec -T db pg_restore -U mymind -d mymind --clean --if-exists < mymind-backup.dump
```

## Migracje

Schemat bazy siedzi w jednym pliku: [`src/db/schema.ts`](src/db/schema.ts).

1. Zmieniasz schemat w `src/db/schema.ts`.
2. `npm run db:generate` — drizzle-kit wypluwa nowy plik SQL do `./drizzle`.
3. Restart aplikacji (`npm run dev` albo `docker compose up -d --build`).

Krok 3 wystarczy, bo [`src/instrumentation.ts`](src/instrumentation.ts) — hak startowy
Next.js — stosuje brakujące migracje raz przy uruchomieniu serwera, a Next czeka z obsługą
żądań, aż skończy. Świeży wolumen sam dostaje schemat, istniejąca baza tylko nowe migracje.
`npm run db:migrate` robi to samo bez startu Next.js.

Szczegóły w [`src/db/run-migrations.ts`](src/db/run-migrations.ts):

- **ponawianie połączenia** — w Dockerze Postgres może jeszcze startować (do 30 prób co 2 s);
- **`pg_advisory_lock`** — dwa procesy nie zmigrują bazy jednocześnie;
- **build bez bazy** — `next build` nie wywołuje instrumentation, a pula `pg` otwiera
  połączenie dopiero przy pierwszym zapytaniu, więc obraz buduje się bez działającego Postgresa.

Pliki migracji z `./drizzle` **muszą trafić do repo i do obrazu** (`Dockerfile` je kopiuje).

## Architektura

Każda zakładka to samodzielny moduł zbudowany według jednego wzorca:
**tabela → route → cykl „wczytaj dane → formularz → zapisz przez server action"**.

```
src/
  app/
    layout.tsx          wspólny layout: sidebar / dolny pasek, topbar z PL/EN i motywem
    page.tsx            Pulpit
    <zakładka>/
      page.tsx          Server Component: wczytuje dane, składa widok
      queries.ts        odczyty z bazy (tylko serwer)
      actions.ts        'use server' — mutacje + revalidatePath
      *-form.tsx        Client Components: formularze
  components/           nawigacja, prymitywy UI, ikony, przełączniki
  config/tabs.ts        lista zakładek — jedyne źródło nawigacji
  db/
    schema.ts           WSZYSTKIE tabele
    index.ts            pula połączeń `pg` + instancja Drizzle
    config.ts           DATABASE_URL i domyślny adres lokalny
    run-migrations.ts   migracje z ponawianiem i blokadą
  instrumentation.ts    hak startowy Next.js — odpala migracje
  i18n/
    dictionaries.ts     słowniki PL i EN (PL wyznacza typ — brak tłumaczenia = błąd kompilacji)
    server.ts           getI18n() dla Server Components i akcji (czyta ciasteczko)
    client.tsx          useI18n() dla Client Components
  lib/
    actions.ts          ActionState, parseForm, klocki schematów zod
    date.ts             daty lokalne 'YYYY-MM-DD', formatowanie zależne od języka
```

Rozdział `queries.ts` / `actions.ts` jest celowy: odczyty są zwykłymi funkcjami
serwerowymi, a zapisy — Server Actions z `'use server'`. Widać na pierwszy rzut oka,
co czyta, a co pisze.

### Kontrakt Server Actions

Każda mutacja formularzowa zwraca `ActionState` z [`src/lib/actions.ts`](src/lib/actions.ts):

```ts
type ActionState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  errors?: Record<string, string>; // błędy per pole, już przetłumaczone
  values?: Record<string, string>; // to, co użytkownik wpisał
};
```

Pole `values` nie jest ozdobnikiem: React 19 czyści formularz po zakończeniu akcji,
więc przy błędzie walidacji akcja **oddaje wpisane wartości z powrotem**, a formularz
wstawia je w `defaultValue`. Dwa haczyki, które to wymusza:

- **`<select>` dostaje `key` równy swojej wartości domyślnej.** React aktualizuje
  `defaultValue` inputów, ale nie selecta — bez remountu reset wracałby do pierwszej opcji.
- **Grupa checkboxów** (pory leku) przy pustym wyborze w ogóle nie trafia do FormData.
  Formularz rozróżnia „brak `values`" (pierwsze otwarcie → domyślne) od „jest `values`,
  ale bez klucza" (użytkownik odznaczył wszystko).

Akcje typu „przełącz" i „usuń" są prostsze — zwracają `Promise<void>` i tylko odświeżają
ścieżkę. W UI obsługują je `ActionButton`, `CheckButton` i `DeleteButton` z
[`src/components/ui.tsx`](src/components/ui.tsx).

### Walidacja i tłumaczenia

Schematy zod używają kluczy błędów zamiast tekstu (`'required'`, `'invalidDate'`…),
a `parseForm(schema, formData, t)` zamienia je na komunikat w bieżącym języku. Gotowe klocki:
`requiredText`, `optionalText`, `isoDate`, `optionalIsoDate`, `optionalTime`,
`optionalNumber` (akceptuje przecinek dziesiętny), `checkbox`, `idField`.

Język trzyma ciasteczko `mymind-lang`. Server Components i akcje czytają je przez
`getI18n()`, Client Components dostają słownik z kontekstu przez `useI18n()`.

## Jak dodać nową zakładkę

Powiedzmy, że chcesz zakładkę **Książki**.

**1. Dopisz tabelę** w `src/db/schema.ts`:

```ts
export const books = pgTable('books', {
  id: id(),
  title: text('title').notNull(),
  author: text('author').notNull().default(''),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Book = typeof books.$inferSelect;
```

Helpery `id()`, `day()`, `createdAt()` / `updatedAt()` są na górze pliku — `updatedAt()` sam bumpuje
znacznik przy `db.update()`.

**2. Wygeneruj migrację:**

```bash
npm run db:generate
```

**3. Dopisz teksty** w [`src/i18n/dictionaries.ts`](src/i18n/dictionaries.ts) — w obu
językach `nav.books`, `sub.books` i sekcję `books: { … }` z etykietami. Jeśli zapomnisz
o angielskim, TypeScript nie przepuści builda.

**4. Zarejestruj zakładkę** w [`src/config/tabs.ts`](src/config/tabs.ts) — sidebar,
dolny pasek i tytuł w topbarze podchwycą ją same:

```ts
{ key: 'books', href: '/ksiazki', Icon: NotesIcon, implemented: true },
```

Z `implemented: false` zakładka dostaje w nawigacji znacznik `WIP`, a jej `page.tsx`
może na razie renderować tylko `<WorkInProgress />` z
[`src/components/page-header.tsx`](src/components/page-header.tsx).

**5. Skopiuj strukturę route'a.** Najprostszy wzorzec to `src/app/notatki/`
(lista + pełny CRUD + przełącznik). Dla jednego wiersza z upsertem weź `src/app/profil/`,
dla filtrów w URL-u — `src/app/zadania/`.

```
src/app/ksiazki/
  queries.ts      getBooks() — select + orderBy
  actions.ts      createBook / updateBook / deleteBook
  book-form.tsx   formularz dodawania
  book-item.tsx   wiersz listy z trybem edycji
  page.tsx        export const dynamic = 'force-dynamic'
```

W `actions.ts` podmieniasz schemat zod, tabelę i ścieżkę w `revalidatePath`.
Reszta — `parseForm`, `ActionState`, `SubmitButton`, `DeleteButton`, `Field` — jest wspólna.

**6. Pamiętaj o `export const dynamic = 'force-dynamic'`** w `page.tsx`. Bez tego Next.js
mógłby prerenderować stronę w trakcie builda i pokazać dane zamrożone z momentu budowania.

## Design

UI pochodzi z projektu Claude Design („Zorza") i jest odwzorowany 1:1 w CSS-ie.
Ciepła paleta, dwa fonty (Hanken Grotesk + Spectral), motyw jasny i ciemny, PL/EN.

- **Tokeny** — paleta, promienie i cienie siedzą w `:root` oraz `[data-theme="dark"]`
  na górze [`src/app/globals.css`](src/app/globals.css). Przestylowanie aplikacji =
  podmiana tych dwóch bloków, bez ruszania JSX.
- **Klasy semantyczne** — `.card`, `.txt`, `.btn-primary`, `.icon-btn`, `.check`,
  `.seg`, `.status-pill`, `.tag`. Komponenty składają się z nich zamiast z własnych stylów.
- **Motyw** — przełącznik zapisuje wybór w `localStorage`, a inline'owy skrypt w
  [`src/components/theme-toggle.tsx`](src/components/theme-toggle.tsx) ustawia
  `data-theme` przed pierwszym renderem, więc nie ma mignięcia. Domyślnie motyw idzie
  za ustawieniem systemu.
- **Fonty** — `next/font/google` pobiera je w trakcie builda i serwuje z własnego serwera.
- **Nawigacja** — sidebar na desktopie, dolny pasek poniżej 820 px.

### Odstępstwa od pliku designu

- **Aktywność** — wpisy ręczne zamiast synchronizacji z Google Health (brak zewnętrznych
  integracji w v1). Znaczek „Google Health · zsync." zastąpiony „Wpisy ręczne".
- **Nazwa** — MyMind zamiast „Zorza", znak „M" zamiast „Z".
- **Rzeczy, których design nie przewidywał, a dane z v1 je mają** zostały zachowane:
  tytuły notatek, opisy i linki projektów, edycja i kasowanie wszędzie.
