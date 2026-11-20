import type { ReactNode } from 'react';
import { Card, CardDescription, CardTitle } from '../../components/Card';

interface InsightSectionProps {
  title: string;
  /** The one-sentence answer shown under the title. */
  takeaway: string | null;
  children: ReactNode;
}

export function InsightSection({ title, takeaway, children }: InsightSectionProps) {
  return (
    <Card aria-label={title}>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{takeaway ?? 'No data for these filters.'}</CardDescription>
      {children}
    </Card>
  );
}
