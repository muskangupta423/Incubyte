import type { ReactNode } from 'react';
import styled from 'styled-components';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Buttons shown on the right of the title (keep them compact on phones, e.g. icon-only). */
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Header>
      <div>
        <Title>{title}</Title>
        {description && <Description>{description}</Description>}
      </div>
      {actions && <Actions>{actions}</Actions>}
    </Header>
  );
}

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  ${({ theme }) => theme.media.tablet} {
    align-items: flex-end;
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xxl};

  ${({ theme }) => theme.media.desktop} {
    font-size: ${({ theme }) => theme.fontSizes.display};
  }
`;

const Description = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Actions = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;
