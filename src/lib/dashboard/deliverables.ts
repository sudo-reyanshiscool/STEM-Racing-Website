// What every team hands in. The list is fixed: it was given by the programme's student lead.

export const DELIVERABLES = [
  { key: 'car', label: 'Car' },
  { key: 'engineering-drawings', label: 'Engineering Drawings' },
  { key: 'renders', label: 'Renders' },
  { key: 'portfolio-engineering', label: 'Engineering Portfolio' },
  { key: 'portfolio-enterprise', label: 'Enterprise Portfolio' },
  { key: 'portfolio-project-management', label: 'Project Management Portfolio' },
  { key: 'ai-declaration', label: 'AI Declaration' },
  { key: 'pit-display', label: 'Pit Display' },
  { key: 'verbal-presentation-script', label: 'Verbal Presentation Script' },
  { key: 'verbal-presentation-video', label: 'Verbal Presentation Video' },
] as const;

export type DeliverableKey = (typeof DELIVERABLES)[number]['key'];

export const STATUSES = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
] as const;

export type Status = (typeof STATUSES)[number]['value'];

export function isDeliverableKey(value: unknown): value is DeliverableKey {
  return DELIVERABLES.some((item) => item.key === value);
}

export function isStatus(value: unknown): value is Status {
  return STATUSES.some((status) => status.value === value);
}
