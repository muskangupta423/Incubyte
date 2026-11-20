import type { ReactNode } from 'react';
import { MessagePanel, MessageText, MessageTitle } from './MessagePanel';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <MessagePanel>
      <MessageTitle>{title}</MessageTitle>
      <MessageText>{message}</MessageText>
      {action}
    </MessagePanel>
  );
}
