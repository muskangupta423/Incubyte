import { useId, useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { formatNumber } from '../utils/format';
import { Button } from './Button';
import { controlStyles, DropdownArrow, dropdownControlStyles } from './form-controls';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * Sticks to the bottom of the screen, so paging never needs a scroll to the end of a long table.
 * Compact inline labels keep it to one row on desktop (two short rows on phones).
 */
export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pageSizeId = useId();
  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  const lastPage = Math.max(totalPages, 1);

  return (
    <Bar aria-label="Pagination">
      <Summary aria-live="polite">
        Showing {formatNumber(firstItem)}–{formatNumber(lastItem)} of {formatNumber(totalItems)}
      </Summary>

      <Controls>
        <InlineField>
          <label htmlFor={pageSizeId}>Rows per page</label>
          <DropdownArrow>
            <CompactSelect
              id={pageSizeId}
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </CompactSelect>
          </DropdownArrow>
        </InlineField>

        {lastPage > 1 && <JumpToPage lastPage={lastPage} onPageChange={onPageChange} />}

        <PageButtons>
          <Button
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeftIcon />
          </Button>
          <PageLabel>
            Page {formatNumber(page)} of {formatNumber(lastPage)}
          </PageLabel>
          <Button
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRightIcon />
          </Button>
        </PageButtons>
      </Controls>
    </Bar>
  );
}

interface JumpToPageProps {
  lastPage: number;
  onPageChange: (page: number) => void;
}

/**
 * "Go to page [ 250 ] Go" — essential when there are hundreds of pages.
 * A number outside the range shows a message and stays on the current page, rather than silently
 * jumping elsewhere: a typo like 1111 instead of 111 should be noticed, not hidden.
 */
function JumpToPage({ lastPage, onPageChange }: JumpToPageProps) {
  const inputId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  function jump(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requested = Number(draft);
    if (!Number.isInteger(requested) || requested < 1 || requested > lastPage) {
      setError(`Enter a page from 1 to ${formatNumber(lastPage)}`);
      return;
    }
    onPageChange(requested);
    setDraft('');
  }

  return (
    // noValidate: we show our own message instead of the browser's built-in validation tooltip.
    <InlineField as="form" onSubmit={jump} noValidate>
      <label htmlFor={inputId}>Go to page</label>
      <CompactInput
        id={inputId}
        type="number"
        inputMode="numeric"
        min={1}
        max={lastPage}
        value={draft}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(null);
        }}
      />
      <Button size="sm" type="submit" disabled={draft === ''}>
        Go
      </Button>
      {error && (
        <JumpError id={errorId} role="alert">
          {error}
        </JumpError>
      )}
    </InlineField>
  );
}

const JumpError = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  white-space: nowrap;
`;

const Bar = styled.nav`
  position: sticky;
  bottom: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Summary = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
`;

const InlineField = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: 0;

  label {
    color: ${({ theme }) => theme.colors.textMuted};
    white-space: nowrap;
  }
`;

const CompactSelect = styled.select`
  ${controlStyles}
  ${dropdownControlStyles}
  width: auto;
  min-height: ${({ theme }) => theme.layout.controlHeightSmall};
  cursor: pointer;
`;

const CompactInput = styled.input`
  ${controlStyles}
  width: 5rem;
  min-height: ${({ theme }) => theme.layout.controlHeightSmall};
`;

const PageButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PageLabel = styled.span`
  white-space: nowrap;
`;
