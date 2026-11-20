import styled from 'styled-components';
import { Button } from './Button';
import { CloseIcon } from './icons';

export interface ActiveFilter {
  /** What is filtered, e.g. "Country" (read out with the value by screen readers). */
  name: string;
  /** The chosen value, e.g. "India". */
  value: string;
  onRemove: () => void;
}

interface ActiveFiltersProps {
  filters: readonly ActiveFilter[];
  onClearAll: () => void;
}

/**
 * The filters in use, as small removable chips plus "Clear all" — on phones and tablets, where a
 * full-size "Clear filters" button took too much room and looked like another dropdown.
 * Renders nothing when no filter is set.
 */
export function ActiveFilters({ filters, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <Wrapper>
      <ChipList aria-label="Active filters">
        {filters.map((filter) => (
          <li key={filter.name}>
            <Chip
              type="button"
              onClick={filter.onRemove}
              aria-label={`Remove ${filter.name} filter: ${filter.value}`}
            >
              {filter.value}
              <CloseIcon />
            </Chip>
          </li>
        ))}
      </ChipList>
      <Button variant="ghost" size="sm" onClick={onClearAll}>
        Clear all
      </Button>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ChipList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: ${({ theme }) => theme.layout.controlHeightSmall};
  padding: 0 ${({ theme }) => theme.spacing.sm} 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.onAccent};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.motion.fast} ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;
