import Link from 'next/link';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import { DeleteButton } from '@/components/ui';
import type { CalendarEvent, EventCategory } from '@/db/schema';
import { getI18n } from '@/i18n/server';
import { formatDate, formatMonth, formatMonthShort, today } from '@/lib/date';

import { deleteEvent } from './actions';
import { EventForm } from './event-form';
import {
  CATEGORY_COLOR,
  getEventsBetween,
  getEventsOn,
  getUpcomingEvents,
  resolveView,
} from './queries';

export const dynamic = 'force-dynamic';

const href = (month: string, day?: string) =>
  day ? `/kalendarz?m=${month}&d=${day}` : `/kalendarz?m=${month}`;

export default async function KalendarzPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const todayStr = today();
  const { view, selected } = resolveView(params['m'], params['d'], todayStr);

  const firstCell = view.cells.find((cell) => cell !== null) ?? `${view.key}-01`;
  const lastCell = [...view.cells].reverse().find((cell) => cell !== null) ?? `${view.key}-28`;

  const [{ t, locale }, monthEvents, dayEvents, upcoming] = await Promise.all([
    getI18n(),
    getEventsBetween(firstCell, lastCell),
    getEventsOn(selected),
    getUpcomingEvents(todayStr),
  ]);

  const c = t.calendar;

  // Kropki w siatce: unikalne kategorie wydarzeń danego dnia (maks. 3).
  const dots = new Map<string, EventCategory[]>();
  for (const event of monthEvents) {
    const list = dots.get(event.date) ?? [];
    if (!list.includes(event.category) && list.length < 3) list.push(event.category);
    dots.set(event.date, list);
  }

  return (
    <>
      <PageHeader title={t.nav.calendar} description={t.sub.calendar} />

      <div className="cal-layout">
        <section className="card">
          <div className="cal-head">
            <h2 className="card-title cap-first">{formatMonth(view.year, view.month, locale)}</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <Link className="icon-btn" href={href(view.prevKey)} aria-label={c.prev} title={c.prev} scroll={false}>
                <ChevronLeftIcon />
              </Link>
              <Link className="icon-btn" href="/kalendarz" scroll={false}>
                {c.today}
              </Link>
              <Link className="icon-btn" href={href(view.nextKey)} aria-label={c.next} title={c.next} scroll={false}>
                <ChevronRightIcon />
              </Link>
            </div>
          </div>

          <div className="cal-grid" style={{ marginBottom: 6 }}>
            {c.dayHeaders.map((label) => (
              <span key={label} className="cal-dow">
                {label}
              </span>
            ))}
          </div>

          <div className="cal-grid">
            {view.cells.map((cell, index) =>
              cell === null ? (
                <span key={`empty-${index}`} />
              ) : (
                <Link
                  key={cell}
                  href={href(view.key, cell)}
                  scroll={false}
                  className={[
                    'cal-cell',
                    cell === todayStr ? 'cal-today' : '',
                    cell === selected ? 'cal-selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={cell === selected ? 'date' : undefined}
                  aria-label={formatDate(cell, locale)}
                >
                  {Number(cell.slice(8))}
                  <span className="cal-dots">
                    {(dots.get(cell) ?? []).map((category) => (
                      <span key={category} className="cal-dot" style={{ background: CATEGORY_COLOR[category] }} />
                    ))}
                  </span>
                </Link>
              ),
            )}
          </div>
        </section>

        <section className="card">
          <h2 className="card-title cap-first" style={{ marginBottom: 3 }}>
            {formatDate(selected, locale, false)}
          </h2>
          <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 13 }}>
            {c.eventsCount(dayEvents.length)}
          </p>

          {dayEvents.length === 0 ? (
            <p className="empty" style={{ padding: '28px 0' }}>
              {c.noEvents}
            </p>
          ) : (
            <ul className="plain-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dayEvents.map((event) => (
                <DayEvent key={event.id} event={event} label={c.categories[event.category]} allDay={c.allDay} confirm={c.deleteConfirm(event.title)} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="stack" style={{ marginTop: 18 }}>
        <EventForm defaultDate={selected} />

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 6 }}>
            {c.upcoming}
          </h2>
          {upcoming.length === 0 ? (
            <p className="empty" style={{ padding: '24px 0' }}>
              {c.noUpcoming}
            </p>
          ) : (
            <ul className="list">
              {upcoming.map((event) => (
                <li key={event.id} className="list-row">
                  <Link href={href(event.date.slice(0, 7), event.date)} className="cal-up-date" scroll={false}>
                    <span className="cal-up-day">{Number(event.date.slice(8))}</span>
                    <span className="cal-up-mon">{formatMonthShort(event.date, locale)}</span>
                  </Link>
                  <span className="cal-dot" style={{ width: 9, height: 9, background: CATEGORY_COLOR[event.category] }} />
                  <div className="row-main">
                    <div className="row-title" style={{ fontSize: 14.5 }}>
                      {event.title}
                    </div>
                    <div className="row-sub">{c.categories[event.category]}</div>
                  </div>
                  <span className="card-meta">{event.time || c.allDay}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function DayEvent({
  event,
  label,
  allDay,
  confirm,
}: {
  event: CalendarEvent;
  label: string;
  allDay: string;
  confirm: string;
}) {
  return (
    <li className="day-event">
      <span className="day-event-bar" style={{ background: CATEGORY_COLOR[event.category] }} />
      <div className="row-main">
        <div style={{ fontWeight: 600, fontSize: 14 }}>{event.title}</div>
        <div className="row-sub">
          {event.time || allDay} · {label}
        </div>
      </div>
      <DeleteButton action={deleteEvent} id={event.id} confirmText={confirm} />
    </li>
  );
}
