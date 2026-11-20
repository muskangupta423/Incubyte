import styled from 'styled-components';
import { formatNumber } from '../utils/format';
import { Button } from './Button';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { SelectField } from './SelectField';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <Wrapper aria-label="Pagination">
      <Summary aria-live="polite">
        Showing {formatNumber(firstItem)}–{formatNumber(lastItem)} of {formatNumber(totalItems)}
      </Summary>

      <Controls>
        <PageSize>
          <SelectField
            label="Rows per page"
            value={String(pageSize)}
            options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
            onChange={(value) => onPageSizeChange(Number(value))}
          />
        </PageSize>

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
            Page {formatNumber(page)} of {formatNumber(Math.max(totalPages, 1))}
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
    </Wrapper>
  );
}

const Wrapper = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.lg};

  ${({ theme }) => theme.media.tablet} {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`;

const Summary = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Controls = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const PageSize = styled.div`
  width: 7rem;
`;

const PageButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PageLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
`;
