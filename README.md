# MyMind

Osobisty, jednoużytkownikowy „second brain" — magazyn informacji o mnie. Chodzi lokalnie
na Raspberry Pi 5 w sieci domowej. **Bez autoryzacji i bez zewnętrznych integracji** —
v1 zakłada, że dostęp do sieci domowej to wystarczająca granica.

## Stack

| Warstwa    | Wybór                                                      |
| ---------- | ---------------------------------------------------------- |
| Framework  | Next.js 15 (App Router), TypeScript strict                  |
| Mutacje    | Server Actions (bez osobnej warstwy API)                    |
| Baza       | SQLite przez Drizzle ORM + better-sqlite3                   |
| Migracje   | drizzle-kit, aplikowane automatycznie przy pierwszym zapytaniu |
| Plik bazy  | `./data/app.db` (na wolumenie Dockera)                      |
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
z `taken = true`". Kliknięcie robi upsert tego wiersza. Nowy dzień = brak wiersza =
odznaczone — nic nie trzeba resetować, a historia zostaje w bazie i zasila siatkę tygodnia
(pełne kółko = wszystkie pory, obwódka = część, szare = nic).

### Aktywność: wpisy ręczne

W designie dane szły z Google Health. v1 nie ma zewnętrznych integracji, więc kroki, sen
i kalorie wpisuje się ręcznie (formularz „Statystyki dnia"). Cele dzienne (10 000 kroków,
8 h snu, 2 500 kcal) są stałymi w [`src/app/aktywnosc/queries.ts`](src/app/aktywnosc/queries.ts).
Integracja z zegarkiem to naturalny kandydat na v2 — wystarczy, że będzie upsertować
wiersze do `activity_days` i `workouts`.

## Uruchomienie w trybie deweloperskim

```bash
npm install
```

```bash
npm run dev
```

Aplikacja stoi na http://localhost:3000. Baza `./data/app.db` tworzy się i migruje sama
przy pierwszym zapytaniu — nie trzeba nic odpalać ręcznie.

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

Aplikacja słucha na porcie 3000, restartuje się z `unless-stopped`, a baza leży
w `./data` na hoście, więc **przetrwa przebudowę obrazu**. Build potrzebuje internetu
(npm i fonty z Google Fonts, które `next/font` wkleja do obrazu) — działająca aplikacja już nie.

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

Cała baza to jeden plik, ale przy działającym kontenerze SQLite pracuje w trybie WAL —
zwykłe `cp data/app.db` potrafi zgubić ostatnie zapisy. Zrób spójną kopię przez `VACUUM INTO`:

```bash
docker compose exec mymind node -e "require('better-sqlite3')('/app/data/app.db').exec(\"VACUUM INTO '/app/data/backup.db'\")"
```

Kopia ląduje w `./data/backup.db` na hoście. Nie trzeba zatrzymywać aplikacji.

## Migracje

Schemat bazy siedzi w jednym pliku: [`src/db/schema.ts`](src/db/schema.ts).

1. Zmieniasz schemat w `src/db/schema.ts`.
2. `npm run db:generate` — drizzle-kit wypluwa nowy plik SQL do `./drizzle`.
3. Restart aplikacji (`npm run dev` albo `docker compose up -d --build`).

Krok 3 wystarczy, bo [`src/db/index.ts`](src/db/index.ts) woła `migrate()` przy pierwszym
zapytaniu — świeży wolumen po `docker compose up` sam się zmigruje, a istniejąca baza
dostanie tylko brakujące migracje. `npm run db:migrate` jest awaryjnym wytrychem.

Pliki migracji z `./drizzle` **muszą trafić do repo i do obrazu** (`Dockerfile` je kopiuje).

**Dlaczego połączenie jest leniwe.** `db` to Proxy — plik otwiera się dopiero przy pierwszym
wywołaniu metody, nie przy imporcie modułu. `next build` importuje strony w kilku procesach
równolegle; gdyby każdy migrował przy imporcie, ścigałyby się o ten sam plik
(„table already exists"). Strony są dynamiczne, więc build bazy w ogóle nie dotyka.

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
    index.ts            leniwe połączenie + automatyczne migracje
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
export const books = sqliteTable('books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  author: text('author').notNull().default(''),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Book = typeof books.$inferSelect;
```

Helpery `createdAt()` / `updatedAt()` są na górze pliku — `updatedAt()` sam bumpuje
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
