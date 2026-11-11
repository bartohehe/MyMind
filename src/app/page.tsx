import Link from 'next/link';

import { CheckButton } from '@/components/ui';
import { getI18n } from '@/i18n/server';
import { formatDate, today } from '@/lib/date';

import { getLatestJournalEntry } from './dziennik/queries';
import { MOOD_COLORS, moodLabel } from './dziennik/moods';
import { toggleTaken } from './leki/actions';
import { getMedications, takenProgress } from './leki/queries';
import { getProfile } from './profil/queries';
import { profileSummary } from './profil/summary';

export const dynamic = 'force-dynamic';

export default async function PulpitPage() {
  const [{ t, locale }, meds, latest, profile] = await Promise.all([
    getI18n(),
    getMedications(),
    getLatestJournalEntry(),
    getProfile(),
  ]);

  const d = t.dashboard;
  const hour = new Date().getHours();
  const greet = hour < 12 ? d.greetMorning : hour < 18 ? d.greetDay : d.greetEvening;
  const firstName = profile.fullName.split(/\s+/)[0] ?? '';

  const active = meds.filter((medication) => medication.active);
  const progress = takenProgress(meds);
  const s = profileSummary(profile, t, locale);
  const p = t.profile;

  return (
    <>
      <header className="page-head">
        <h1 style={{ fontSize: 30 }}>{firstName ? `${greet}, ${firstName}` : greet}</h1>
        <p className="cap-first">{formatDate(today(), locale)}</p>
      </header>

      <div className="dash-grid">
        <section className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-head">
            <h2 className="card-title">{d.medsTitle}</h2>
            <span className="card-meta">{t.meds.taken(progress.done, progress.total)}</span>
          </div>
          <div className="bar" style={{ marginBottom: 16 }}>
            <div className="bar-fill" style={{ width: `${progress.pct}%` }} />
          </div>

          {active.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
              {d.noMeds}{' '}
              <Link href="/leki" style={{ fontWeight: 600 }}>
                {d.manageMeds} →
              </Link>
            </p>
          ) : (
            <ul className="plain-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {active.map((medication) => (
                <li key={medication.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{medication.name}</span>{' '}
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>{medication.dose}</span>
                  </span>
                  <div style={{ display: 'flex', gap: 14 }}>
                    {medication.slots.map((slot) => (
                      <CheckButton
                        key={slot.slot}
                        action={toggleTaken}
                        fields={{ id: medication.id, slot: slot.slot }}
                        checked={slot.taken}
                        label={t.meds.toggleLabel(medication.name, t.meds.slot[slot.slot], slot.taken)}
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title" style={{ marginBottom: 14 }}>
            {d.latestTitle}
          </h2>
          {latest ? (
            <>
              <div className="entry-meta">
                <span
                  className="mood-dot"
                  style={{ width: 14, height: 14, background: latest.mood ? MOOD_COLORS[latest.mood] : 'var(--accent)' }}
                />
                {latest.mood ? (
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{moodLabel(latest.mood, t.diary.moods)}</span>
                ) : null}
                <span className="cap-first" style={{ color: 'var(--muted)' }}>
                  {latest.mood ? '· ' : ''}
                  {formatDate(latest.date, locale, false)}
                </span>
              </div>
              <p className="entry-text clamp-4" style={{ fontSize: 14, flex: 1, marginBottom: 16 }}>
                {latest.content}
              </p>
              <Link href="/dziennik" style={{ fontSize: 13, fontWeight: 600 }}>
                {d.openDiary} →
              </Link>
            </>
          ) : (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
              {d.noEntries}{' '}
              <Link href="/dziennik" style={{ fontWeight: 600 }}>
                {d.writeFirst} →
              </Link>
            </p>
          )}
        </section>

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 14 }}>
            {t.nav.profile}
          </h2>
          {s.name ? (
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>{s.name}</div>
          ) : (
            <Link href="/profil" style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
              {d.fillProfile} →
            </Link>
          )}
          <div className="dash-profile">
            <Mini label={p.blood} value={s.blood} />
            <Mini label={p.weight} value={s.weight} />
            <Mini label={p.height} value={s.height} />
            <Mini label={p.age} value={s.age} />
          </div>
        </section>
      </div>
    </>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="micro-label" style={{ marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{value || <span style={{ color: 'var(--muted)' }}>—</span>}</div>
    </div>
  );
}
