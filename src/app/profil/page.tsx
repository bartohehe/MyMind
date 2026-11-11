import { ProfileIcon } from '@/components/icons';
import { PageHeader } from '@/components/page-header';
import { SecretValue } from '@/components/secret-value';
import { getI18n } from '@/i18n/server';
import { formatDateTime } from '@/lib/date';

import { ProfileForm } from './profile-form';
import { getProfile } from './queries';
import { profileSummary } from './summary';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const [{ t, locale }, profile] = await Promise.all([getI18n(), getProfile()]);
  const s = profileSummary(profile, t, locale);
  const p = t.profile;

  return (
    <>
      <PageHeader title={t.nav.profile} description={t.sub.profile} />

      <div className="stack">
        <section className="card">
          <div className="profile-head">
            <span className="avatar">{s.initials || <ProfileIcon size={28} />}</span>
            <div style={{ minWidth: 0 }}>
              <div className="profile-name">{s.name || p.healthProfile}</div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                {s.age || p.updated(formatDateTime(profile.updatedAt, locale))}
              </div>
            </div>
          </div>

          <div className="field-grid">
            <Summary label={p.weight} value={s.weight} />
            <Summary label={p.height} value={s.height} />
            <Summary label={p.blood} value={s.blood} />
            <Summary label={p.age} value={s.age} />
          </div>
        </section>

        <TagCard label={p.allergies} items={profile.allergies} empty={t.common.nothing} />
        <TagCard label={p.chronic} items={profile.chronicConditions} empty={t.common.nothing} />

        <section className="card">
          <h2 className="card-title" style={{ marginBottom: 16 }}>
            {p.sensitive}
          </h2>
          <div className="field-grid">
            <Summary label={p.insurance} value={profile.insurance} />
            <div>
              <div className="micro-label">{p.pesel}</div>
              <div className="micro-value">
                <SecretValue value={profile.pesel} />
              </div>
            </div>
          </div>
        </section>

        <ProfileForm profile={profile} />
      </div>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="micro-label">{label}</div>
      <div className="micro-value">{value || <span style={{ color: 'var(--muted)' }}>—</span>}</div>
    </div>
  );
}

function TagCard({
  label,
  items,
  empty,
}: {
  label: string;
  items: readonly string[];
  empty: string;
}) {
  return (
    <section className="card">
      <h2 className="card-title" style={{ marginBottom: 14 }}>
        {label}
      </h2>
      {items.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{empty}</p>
      ) : (
        <ul className="tag-row">
          {items.map((item) => (
            <li key={item} className="tag">
              <span className="tag-dot" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
