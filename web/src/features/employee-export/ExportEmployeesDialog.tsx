import { MAX_EXPORT_ROWS, type EmployeeListQuery } from '@acme/shared';
import { useMutation } from '@tanstack/react-query';
import styled from 'styled-components';
import { Button } from '../../components/Button';
import { Dialog, type DialogVisibility } from '../../components/Dialog';
import { InlineAlert } from '../../components/InlineAlert';
import { useToast } from '../../components/toast/toast-context';
import { downloadFile } from '../../utils/download';
import { formatNumber } from '../../utils/format';
import { useEmployeeList } from '../employees/use-employee-queries';
import { fetchEmployeesForExport } from './export-api';
import { exportFile, exportFileName, type ExportFormat } from './export-file';

interface ExportEmployeesDialogProps extends DialogVisibility {
  /** The list as it is on screen: its search, filters and sort are exported (paging is not). */
  query: EmployeeListQuery;
  hasFilters: boolean;
}

/** Downloads the employees in the list — Excel or CSV — ready to edit and upload back. */
export function ExportEmployeesDialog({
  query,
  hasFilters,
  ...visibility
}: ExportEmployeesDialogProps) {
  const { showToast } = useToast();
  // Already cached: it's the list on screen. Only its total is needed here.
  const { data: list } = useEmployeeList(query);
  const total = list?.totalItems;

  const download = useMutation({
    mutationFn: async (format: ExportFormat) => {
      const { search, country, department, jobTitle, sortBy, sortOrder } = query;
      const employees = await fetchEmployeesForExport({
        search,
        country,
        department,
        jobTitle,
        sortBy,
        sortOrder,
      });
      downloadFile(exportFile(employees, format), exportFileName(format));
      return employees.length;
    },
    onSuccess: (count) => {
      showToast(`${formatNumber(count)} employees exported`, 'success');
      visibility.onClose();
    },
  });

  const who = hasFilters ? 'everyone matching your current search and filters' : 'all employees';

  return (
    <Dialog
      {...visibility}
      variant="centered"
      title="Export employees"
      footer={<Button onClick={visibility.onClose}>Cancel</Button>}
    >
      <Content>
        {download.error && <InlineAlert>{download.error.message}</InlineAlert>}
        <p>
          {total === undefined
            ? `Exports ${who}`
            : `Exports ${formatNumber(Math.min(total, MAX_EXPORT_ROWS))} employees — ${who}`}
          , in the list&apos;s order. The file can be edited and uploaded back.
        </p>
        {total !== undefined && total > MAX_EXPORT_ROWS && (
          <InlineAlert>
            Only the first {formatNumber(MAX_EXPORT_ROWS)} of {formatNumber(total)} fit in one file.
            Narrow the filters to export the rest.
          </InlineAlert>
        )}
        <Formats>
          <Button
            variant="primary"
            disabled={download.isPending}
            onClick={() => download.mutate('xlsx')}
          >
            {download.isPending && download.variables === 'xlsx' ? 'Preparing…' : 'Excel (.xlsx)'}
          </Button>
          <Button disabled={download.isPending} onClick={() => download.mutate('csv')}>
            {download.isPending && download.variables === 'csv' ? 'Preparing…' : 'CSV (.csv)'}
          </Button>
        </Formats>
      </Content>
    </Dialog>
  );
}

const Content = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};

  p {
    margin: 0;
  }
`;

const Formats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;
