import { PageHeader } from '@/components/page-header';
import type { Dict } from '@/i18n/dictionaries';
import { getI18n } from '@/i18n/server';
import { formatDate, today } from '@/lib/date';

import { MedicationForm } from './medication-form';
import { MedicationItem } from './medication-item';
import { getMedications, getWeekHistory, takenProgress, type WeekHistory } from './queries';

export const dynamic = 'force-dynamic';

export default async function LekiPage() {
  const [{ t, locale }, medications, week] = await Promise.all([
    getI18n(),
    getMedications(),
    getWeekHistory(),
  ]);

  const active = medications.filter((medication) => medication.active);
  const inactive = medications.filter((medication) => !medication.active);
  const progress = takenProgress(medications);

  return (
    <>
      <PageHeader title={t.nav.meds} description={t.sub.meds} />

      <div className="stack">
        <MedicationForm />

        <section className="card">
          <div className="card-head">
            <h2 className="card-title cap-first">{formatDate(today(), locale, false)}</h2>
            <span className="card-meta">{t.meds.taken(progress.done, progress.total)}</span>
          </div>

          <div className="bar" style={{ marginBottom: 6 }}>
            <div className="bar-fill" style={{ width: `${progress.pct}%` }} />
          </div>

          {active.length === 0 ? (
            <p className="empty" style={{ padding: '28px 0' }}>
              {t.meds.noActive}
            </p>
          ) : (
            <ul className="list">
              {active.map((medication) => (
                <MedicationItem key={medication.id} medication={medication} />
              ))}
            </ul>
          )}
        </section>

        {week.rows.length > 0 ? <WeekTable week={week} t={t} /> : null}

        {inactive.length > 0 ? (
          <section className="card">
            <h2 className="card-title" style={{ marginBottom: 6 }}>
              {t.meds.inactive}
            </h2>
            <ul className="list">
              {inactive.map((medication) => (
                <MedicationItem key={medication.id} medication={medication} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}

function WeekTable({ week, t }: { week: WeekHistory; t: Dict }) {
  return (
    <section className="card">
      <h2 className="card-title" style={{ marginBottom: 18 }}>
        {t.meds.weekly}
      </h2>

      <div className="week-scroll">
        <div className="week-grid">
          <div className="week-head">
            <span />
            {week.days.map((day, index) => (
              <span
                key={day.date}
                className={`week-day ${day.isToday ? 'week-day-today' : ''}`}
                title={day.date}
              >
                {t.meds.days[index]}
              </span>
            ))}
          </div>

          {week.rows.map((row) => (
            <div key={row.id} className="week-row">
              <span className="week-name">{row.name}</span>
              {row.days.map((cell) => (
                <span key={cell.date} className="week-cell">
                  <span
                    className={`week-dot week-dot-${cell.state} ${cell.isToday ? 'week-dot-today' : ''}`}
                    title={`${row.name} · ${cell.date} · ${t.meds.cell[cell.state]}`}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
