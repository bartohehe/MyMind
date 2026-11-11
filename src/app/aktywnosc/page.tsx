import { BoltIcon, MoonIcon, StepsIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import { DeleteButton } from '@/components/ui';
import type { Workout } from '@/db/schema';
import type { Dict, Locale } from '@/i18n/dictionaries';
import { getI18n } from '@/i18n/server';
import { addDays, formatNumber, formatShortDate, today } from '@/lib/date';

import { deleteWorkout } from './actions';
import { DayStatsForm, WorkoutForm } from './activity-forms';
import { GOALS, WORKOUT_LOOK, getActivityDay, getRecentWorkouts, getWeekSteps } from './queries';

export const dynamic = 'force-dynamic';

const pct = (value: number | null | undefined, goal: number) =>
  value === null || value === undefined ? 0 : Math.min(100, Math.round((value / goal) * 100));

export default async function AktywnoscPage() {
  const todayStr = today();
  const [{ t, locale }, day, week, recent] = await Promise.all([
    getI18n(),
    getActivityDay(todayStr),
    getWeekSteps(),
    getRecentWorkouts(),
  ]);
  const a = t.activity;

  const sleep = day?.sleepMinutes ?? null;
  const steps = day?.steps ?? null;
  const calories = day?.calories ?? null;

  const weekMax = Math.max(GOALS.steps, ...week.map((d) => d.steps ?? 0));

  return (
    <>
      <PageHeader
        title={t.nav.activity}
        description={t.sub.activity}
        aside={
          <span className="pill-stat">
            <span className="pill-dot" style={{ background: 'var(--green)' }} />
            {a.manual}
          </span>
        }
      />

      <div className="activity-grid">
        <div className="stack">
          <div className="stat-pair">
            <StatCard
              icon={<MoonIcon size={16} />}
              label={a.sleep}
              value={sleep === null ? '—' : a.sleepValue(Math.floor(sleep / 60), sleep % 60)}
              percent={pct(sleep, GOALS.sleepMinutes)}
              color="var(--violet)"
              sub={sleep === null ? a.noData : a.ofGoal(pct(sleep, GOALS.sleepMinutes))}
            />
            <StatCard
              icon={<BoltIcon />}
              label={a.calories}
              value={calories === null ? '—' : formatNumber(calories, locale)}
              unit={calories === null ? undefined : 'kcal'}
              percent={pct(calories, GOALS.calories)}
              color="var(--amber)"
              sub={calories === null ? a.noData : a.ofGoal(pct(calories, GOALS.calories))}
            />
          </div>

          <section className="card">
            <div className="stat-label">
              <StepsIcon />
              {a.steps}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span className="stat-value" style={{ fontSize: 34 }}>
                {steps === null ? '—' : formatNumber(steps, locale)}
              </span>
              <span className="stat-unit">/ {formatNumber(GOALS.steps, locale)}</span>
            </div>
            <div className="hint" style={{ marginBottom: 20 }}>
              {steps === null ? a.noData : a.ofGoal(pct(steps, GOALS.steps))}
            </div>

            <div className="section-label" style={{ marginBottom: 14 }}>
              {a.weekSteps}
            </div>
            <div className="step-bars">
              {week.map((d, index) => {
                const height = d.steps === null ? 4 : Math.max(4, Math.round((d.steps / weekMax) * 100));
                const reached = (d.steps ?? 0) >= GOALS.steps;
                return (
                  <div key={d.date} className="step-bar" title={`${d.date}: ${d.steps ?? '—'}`}>
                    <span className="step-k">{d.steps === null ? '' : shortK(d.steps, locale)}</span>
                    <div
                      className="step-fill"
                      style={{
                        height: `${height}%`,
                        background: d.isToday ? 'var(--accent)' : reached ? 'var(--green)' : 'var(--border)',
                      }}
                    />
                    <span className="step-day">{t.meds.days[index]}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 6 }}>
            {a.recent}
          </h2>
          {recent.length === 0 ? (
            <p className="empty" style={{ padding: '28px 0' }}>
              {a.noRecent}
            </p>
          ) : (
            <ul className="list">
              {recent.map((workout) => (
                <WorkoutRow key={workout.id} workout={workout} t={t} locale={locale} todayStr={todayStr} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="form-pair" style={{ marginTop: 18 }}>
        <DayStatsForm date={todayStr} day={day} />
        <WorkoutForm date={todayStr} />
      </div>
    </>
  );
}

function shortK(steps: number, locale: Locale): string {
  return steps >= 1000 ? `${formatNumber(steps / 1000, locale, 1)}k` : String(steps);
}

function StatCard({
  icon,
  label,
  value,
  unit,
  percent,
  color,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string | undefined;
  percent: number;
  color: string;
  sub: string;
}) {
  return (
    <section className="card" style={{ padding: 22 }}>
      <div className="stat-label">
        {icon}
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span className="stat-value">{value}</span>
        {unit ? <span className="stat-unit">{unit}</span> : null}
      </div>
      <div className="bar" style={{ marginBottom: 10 }}>
        <div className="bar-fill" style={{ width: `${percent}%`, background: color }} />
      </div>
      <div className="hint">{sub}</div>
    </section>
  );
}

function WorkoutRow({
  workout,
  t,
  locale,
  todayStr,
}: {
  workout: Workout;
  t: Dict;
  locale: Locale;
  todayStr: string;
}) {
  const a = t.activity;
  const look = WORKOUT_LOOK[workout.type];

  const dayLabel =
    workout.date === todayStr
      ? t.common.today
      : workout.date === addDays(todayStr, -1)
        ? t.common.yesterday
        : formatShortDate(workout.date, locale);
  const when = workout.time ? `${dayLabel} · ${workout.time}` : dayLabel;

  const duration = workout.durationMin === null ? null : `${workout.durationMin} min`;
  const distance =
    workout.distanceKm === null ? null : `${formatNumber(workout.distanceKm, locale, 1)} km`;
  const kcal = workout.calories === null ? null : `${formatNumber(workout.calories, locale)} kcal`;

  const metric = distance ?? duration ?? kcal ?? '—';
  const sub = [distance ? duration : null, distance || duration ? kcal : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="list-row">
      <span className="workout-icon" style={{ background: look.tint, color: look.color }} aria-hidden="true">
        {look.emoji}
      </span>
      <div className="row-main">
        <div className="row-title">{a.types[workout.type]}</div>
        <div className="row-sub">{when}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{metric}</div>
        {sub ? <div className="row-sub">{sub}</div> : null}
      </div>
      <DeleteButton action={deleteWorkout} id={workout.id} confirmText={a.deleteConfirm} />
    </li>
  );
}
