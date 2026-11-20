import styled from 'styled-components';
import { Button } from '../../components/Button';
import { TrashIcon } from '../../components/icons';
import { formatNumber } from '../../utils/format';

interface SelectionBarProps {
  count: number;
  /** How many of them are on the page being shown (the others were ticked on other pages). */
  countOnPage: number;
  onClear: () => void;
  onDelete: () => void;
}

/**
 * Shown while rows are ticked: how many, and what can be done with them. Ticks can span pages, so it
 * also says how many are on this page — nobody should be surprised by what "Delete selected" includes.
 */
export function SelectionBar({ count, countOnPage, onClear, onDelete }: SelectionBarProps) {
  return (
    <Bar aria-label="Selected employees">
      <Count aria-live="polite">
        {formatNumber(count)} selected
        {countOnPage < count && <OnPage> · {formatNumber(countOnPage)} on this page</OnPage>}
      </Count>
      <Actions>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear selection
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>
          <TrashIcon />
          Delete selected
        </Button>
      </Actions>
    </Bar>
  );
}

const Bar = styled.section`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  ${({ theme }) => theme.media.tablet} {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  }
`;

const Count = styled.p`
  margin: 0;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const OnPage = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;
