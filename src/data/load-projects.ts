import projectData from './projects.json';
import type { Project, ProjectData } from '../types';

const data = projectData as ProjectData;

export const projects: Project[] = data.projects;
export const techOptions: string[] = data.techOptions;
export const lastUpdated: string = data.lastUpdated;
