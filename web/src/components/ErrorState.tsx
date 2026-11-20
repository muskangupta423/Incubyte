import type { ReactNode } from 'react';
import { MessagePanel, MessageText, MessageTitle } from './MessagePanel';

interface ErrorStateProps {
  title: string;
  message: string;
  /** e.g. a "Try again" button or a link back to safety. */
  action?: ReactNode;
}

/** role="alert" makes screen readers announce the problem as soon as it appears. */
export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <MessagePanel role="alert">
      <MessageTitle>{title}</MessageTitle>
      <MessageText>{message}</MessageText>
      {action}
    </MessagePanel>
  );
}
