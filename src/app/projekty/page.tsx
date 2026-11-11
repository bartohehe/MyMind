import { EmptyState, PageHeader } from '@/components/page-header';
import { getI18n } from '@/i18n/server';
import { today } from '@/lib/date';

import { ProjectForm } from './project-form';
import { ProjectItem } from './project-item';
import { getProjects } from './queries';

export const dynamic = 'force-dynamic';

export default async function ProjektyPage() {
  const [{ t }, projects] = await Promise.all([getI18n(), getProjects()]);
  const inProgress = projects.filter((project) => project.status === 'w toku').length;
  const todayStr = today();

  return (
    <>
      <PageHeader
        title={t.nav.projects}
        description={t.sub.projects}
        aside={
          projects.length > 0 ? (
            <span className="pill-stat">
              <span className="pill-dot" />
              {t.projects.inProgress(inProgress, projects.length)}
            </span>
          ) : undefined
        }
      />

      <div className="stack">
        <ProjectForm />

        {projects.length === 0 ? (
          <EmptyState>{t.projects.empty}</EmptyState>
        ) : (
          <ul className="grid-cards grid-wide plain-list">
            {projects.map((project) => (
              <ProjectItem key={project.id} project={project} today={todayStr} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
