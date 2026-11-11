import 'server-only';

import { asc } from 'drizzle-orm';

import { db } from '@/db';
import { projectTasks, projects, type Project, type ProjectStatus, type ProjectTask } from '@/db/schema';

export type ProjectWithTasks = Project & { tasks: ProjectTask[] };

const STATUS_ORDER: Record<ProjectStatus, number> = { 'w toku': 0, pomysł: 1, zrobione: 2 };

/**
 * Projekty z zadaniami: najpierw w toku, potem pomysły, na końcu zrobione;
 * w grupie — najbliższy termin, potem ostatnio edytowane.
 */
export async function getProjects(): Promise<ProjectWithTasks[]> {
  const rows = db.select().from(projects).all();
  const tasks = db.select().from(projectTasks).orderBy(asc(projectTasks.id)).all();

  const byProject = new Map<number, ProjectTask[]>();
  for (const task of tasks) {
    const list = byProject.get(task.projectId) ?? [];
    list.push(task);
    byProject.set(task.projectId, list);
  }

  return rows
    .map((project) => ({ ...project, tasks: byProject.get(project.id) ?? [] }))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
        b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
}
