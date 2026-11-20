import { useId, useState, type FormEvent, type ReactNode } from 'react';
import styled from 'styled-components';
import { useScreenSize } from '../hooks/useScreenSize';
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
 * Meant to sit in a sticky footer (see EmployeesPage), so paging never needs a scroll to the end.
 * Tablet/desktop: one row with the summary, rows per page, "Go to page" and the page buttons.
 * Phones: one slim row, ‹ Page [3] of 400 ›, where the page number is the "go to page" box.
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
  const screenSize = useScreenSize();
  const isPhone = screenSize === 'phone';
  // Tablets: shorter labels so the bar fits one row; screen readers still hear the full words.
  const onlyAboveTablet = (words: string) =>
    screenSize === 'tablet' ? <span className="visually-hidden">{words}</span> : words;
  const pageSizeId = useId();
  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  const lastPage = Math.max(totalPages, 1);
  const stepProps = { page, lastPage, onPageChange };

  const summary = (
    // Hidden on phones to save room, but still announced to screen readers when the page changes.
    <Summary aria-live="polite" className={isPhone ? 'visually-hidden' : undefined}>
      {onlyAboveTablet('Showing ')}
      {formatNumber(firstItem)}–{formatNumber(lastItem)} of {formatNumber(totalItems)}
    </Summary>
  );

  if (isPhone) {
    return (
      <Bar aria-label="Pagination">
        {summary}
        <PageStep direction="previous" {...stepProps} />
        {lastPage > 1 ? (
          // key: start again from the current page number whenever the page changes.
          <PagePicker key={page} {...stepProps} />
        ) : (
          <PageLabel>Page 1 of 1</PageLabel>
        )}
        <PageStep direction="next" {...stepProps} />
      </Bar>
    );
  }

  return (
    <Bar aria-label="Pagination">
      {summary}

      <Controls>
        <InlineField>
          <label htmlFor={pageSizeId}>Rows{onlyAboveTablet(' per page')}</label>
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

        {lastPage > 1 && (
          <JumpToPage
            lastPage={lastPage}
            onPageChange={onPageChange}
            label={<>Go to{onlyAboveTablet(' page')}</>}
          />
        )}

        <PageButtons>
          <PageStep direction="previous" {...stepProps} />
          <PageLabel>
            Page {formatNumber(page)} of {formatNumber(lastPage)}
          </PageLabel>
          <PageStep direction="next" {...stepProps} />
        </PageButtons>
      </Controls>
    </Bar>
  );
}

interface PageStepProps {
  direction: 'previous' | 'next';
  page: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

function PageStep({ direction, page, lastPage, onPageChange }: PageStepProps) {
  const isPrevious = direction === 'previous';
  return (
    <Button
      size="sm"
      onClick={() => onPageChange(isPrevious ? page - 1 : page + 1)}
      disabled={isPrevious ? page <= 1 : page >= lastPage}
      aria-label={isPrevious ? 'Previous page' : 'Next page'}
    >
      {isPrevious ? <ChevronLeftIcon /> : <ChevronRightIcon />}
    </Button>
  );
}

/** The requested page as a number, or null if it isn't a whole number from 1 to lastPage. */
function toPageNumber(draft: string, lastPage: number): number | null {
  const requested = Number(draft);
  return Number.isInteger(requested) && requested >= 1 && requested <= lastPage ? requested : null;
}

const pageRangeMessage = (lastPage: number) => `Enter a page from 1 to ${formatNumber(lastPage)}`;

interface JumpToPageProps {
  /** "Go to page" (shortened on tablets). */
  label: ReactNode;
  lastPage: number;
  onPageChange: (page: number) => void;
}

/**
 * "Go to page [ 250 ] Go" — essential when there are hundreds of pages.
 * A number outside the range shows a message and stays on the current page, rather than silently
 * jumping elsewhere: a typo like 1111 instead of 111 should be noticed, not hidden.
 */
function JumpToPage({ label, lastPage, onPageChange }: JumpToPageProps) {
  const inputId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  function jump(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requested = toPageNumber(draft, lastPage);
    if (requested === null) {
      setError(pageRangeMessage(lastPage));
      return;
    }
    onPageChange(requested);
    setDraft('');
  }

  return (
    // noValidate: we show our own message instead of the browser's built-in validation tooltip.
    <InlineField as="form" onSubmit={jump} noValidate>
      <label htmlFor={inputId}>{label}</label>
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

interface PagePickerProps {
  page: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

/** Phones: "Page [ 3 ] of 400" — type another number and press Enter (the keyboard shows "Go"). */
function PagePicker({ page, lastPage, onPageChange }: PagePickerProps) {
  const inputId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState(String(page));
  const [error, setError] = useState<string | null>(null);

  function jump(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requested = toPageNumber(draft, lastPage);
    if (requested === null) {
      setError(pageRangeMessage(lastPage));
      return;
    }
    if (requested !== page) onPageChange(requested);
  }

  return (
    <>
      <InlineField as="form" onSubmit={jump} noValidate>
        <label htmlFor={inputId}>Page</label>
        <CompactInput
          id={inputId}
          type="number"
          inputMode="numeric"
          enterKeyHint="go"
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
        <span>of {formatNumber(lastPage)}</span>
      </InlineField>
      {error && (
        <PhoneJumpError id={errorId} role="alert">
          {error}
        </PhoneJumpError>
      )}
    </>
  );
}

const JumpError = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  white-space: nowrap;
`;

const Bar = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  /* Phones: tighter, so ‹ Page [3] of 400 › fits one row even on a 320px screen. */
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  ${({ theme }) => theme.media.tablet} {
    gap: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  }
`;

/** On phones the error gets its own line under the controls. */
const PhoneJumpError = styled(JumpError)`
  flex-basis: 100%;
  text-align: center;
  white-space: normal;
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
  width: 3.5rem;
  padding: 0 ${({ theme }) => theme.spacing.sm};

  ${({ theme }) => theme.media.tablet} {
    width: 5rem;
    padding: 0 ${({ theme }) => theme.spacing.md};
  }
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
