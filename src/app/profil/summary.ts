import type { Profile } from '@/db/schema';
import type { Dict, Locale } from '@/i18n/dictionaries';
import { ageFrom, formatNumber } from '@/lib/date';

/** Gotowe do wyświetlenia wartości profilu — wspólne dla Profilu i Pulpitu. */
export function profileSummary(profile: Profile, t: Dict, locale: Locale) {
  const age = ageFrom(profile.birthDate);
  return {
    name: profile.fullName,
    initials: profile.fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join(''),
    age: age === null ? '' : t.profile.years(age),
    weight:
      profile.weightKg === null
        ? ''
        : `${formatNumber(profile.weightKg, locale, 1)} ${t.profile.weightUnit}`,
    height: profile.heightCm === null ? '' : `${profile.heightCm} ${t.profile.heightUnit}`,
    blood: profile.bloodType,
  };
}
