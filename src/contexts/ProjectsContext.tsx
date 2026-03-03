import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useApiData } from './ApiDataContext';

export type ProjectItem = {
  id: string;
  name: string;
};

const defaultProjects: ProjectItem[] = [
  { id: '0', name: 'General' },
];

type ProjectsContextValue = {
  projectNames: ProjectItem[];
  addProjectName: (id: string, name: string) => void;
  removeProjectName: (id: string) => void;
  updateProjectName: (id: string, name: string) => void;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { projects } = useApiData();
  const projectNames = useMemo(() => {
    const names = projects.map((p) => ({ id: p.id, name: p.name }));
    if (!names.some((n) => n.id === '0')) names.push({ id: '0', name: 'General' });
    return names.length ? names : defaultProjects;
  }, [projects]);

  const addProjectName = () => {};
  const removeProjectName = () => {};
  const updateProjectName = () => {};

  return (
    <ProjectsContext.Provider value={{ projectNames, addProjectName, removeProjectName, updateProjectName }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjectNames() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) return { projectNames: defaultProjects, addProjectName: () => {}, removeProjectName: () => {}, updateProjectName: () => {} };
  return ctx;
}
