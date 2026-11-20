import styled from 'styled-components';

interface StatCardProps {
  label: string;
  value: string;
  /** Extra context under the value, e.g. the same figure in local currency. */
  detail?: string | undefined;
}

/** A headline number. Place inside a <dl>: <dt>/<dd> make screen readers read label and value together. */
export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <Wrapper>
      <Label>{label}</Label>
      <Value>{value}</Value>
      {detail && <Detail>{detail}</Detail>}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  ${({ theme }) => theme.media.desktop} {
    padding: ${({ theme }) => theme.spacing.xl};
  }
`;

const Label = styled.dt`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Value = styled.dd`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  color: ${({ theme }) => theme.colors.heading};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-variant-numeric: tabular-nums;

  ${({ theme }) => theme.media.desktop} {
    font-size: ${({ theme }) => theme.fontSizes.xxl};
  }
`;

const Detail = styled.dd`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;
