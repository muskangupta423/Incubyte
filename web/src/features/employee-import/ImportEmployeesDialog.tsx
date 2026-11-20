import type { ImportCheckResult, ImportRequest } from '@acme/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type ChangeEvent } from 'react';
import styled from 'styled-components';
import { Button } from '../../components/Button';
import { Dialog, type DialogVisibility } from '../../components/Dialog';
import { InlineAlert } from '../../components/InlineAlert';
import { LoadingState } from '../../components/LoadingState';
import { useToast } from '../../components/toast/toast-context';
import { formatNumber } from '../../utils/format';
import { useCountries } from '../countries/use-countries';
import { checkImport, runImport } from './import-api';
import { readSpreadsheet } from './read-spreadsheet';
import { downloadTemplate } from './template';

/** Where the dialog is: one value, so impossible combinations (e.g. errors AND ready) can't happen. */
type Step =
  | { kind: 'choose' }
  | { kind: 'checking'; fileName: string }
  | { kind: 'fileError'; fileName: string; message: string }
  | { kind: 'checked'; fileName: string; rows: ImportRequest['rows']; result: ImportCheckResult };

/**
 * Bulk upload: download the template, choose a file, see what would happen (or what to fix),
 * then import — all rows or none.
 */
export function ImportEmployeesDialog(visibility: DialogVisibility) {
  const inputId = useId();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: countries = [] } = useCountries();
  const [step, setStep] = useState<Step>({ kind: 'choose' });

  const save = useMutation({
    mutationFn: runImport,
    onSuccess: async ({ created, updated }) => {
      showToast(
        `${formatNumber(created + updated)} employees imported: ${formatNumber(created)} added, ${formatNumber(updated)} updated`,
        'success',
      );
      visibility.onClose();
      // Like any change to employees: every list, filter and insight may be affected.
      await queryClient.invalidateQueries();
    },
  });

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset, so choosing the same file again (after fixing it) triggers a new check.
    event.target.value = '';
    if (!file) return;

    save.reset();
    setStep({ kind: 'checking', fileName: file.name });
    const read = await readSpreadsheet(file);
    if (!read.ok) {
      setStep({ kind: 'fileError', fileName: file.name, message: read.message });
      return;
    }
    try {
      const result = await checkImport(read.rows);
      setStep({ kind: 'checked', fileName: file.name, rows: read.rows, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The file could not be checked.';
      setStep({ kind: 'fileError', fileName: file.name, message });
    }
  }

  const ready = step.kind === 'checked' && step.result.errorCount === 0 ? step : null;
  const rowCount = ready ? ready.result.toCreate + ready.result.toUpdate : 0;

  return (
    <Dialog
      {...visibility}
      title="Upload employees"
      footer={
        <>
          <Button onClick={visibility.onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!ready || save.isPending}
            onClick={() => ready && save.mutate(ready.rows)}
          >
            {save.isPending
              ? 'Importing…'
              : `Import ${rowCount > 0 ? formatNumber(rowCount) : ''} employees`}
          </Button>
        </>
      }
    >
      <Steps>
        <Section>
          <h3>1. Fill in the template</h3>
          <Rules>
            <li>
              Leave <strong>Employee code</strong> empty to add someone new (a code is assigned).
              Fill it in to update that employee.
            </li>
            <li>
              <strong>Country</strong>: a name or a code (India or IN) of a country that is set up —
              see the Countries sheet.
            </li>
            <li>
              <strong>Annual salary</strong> in the country&apos;s currency;{' '}
              <strong>Hire date</strong> as a date or YYYY-MM-DD.
            </li>
          </Rules>
          <div>
            <Button onClick={() => downloadTemplate(countries)}>Download template (.xlsx)</Button>
          </div>
        </Section>

        <Section>
          <h3>2. Choose your file</h3>
          <FileRow>
            {/* A real file input (keyboard and screen-reader friendly), styled like a button. */}
            <FileLabel htmlFor={inputId}>Choose file</FileLabel>
            <HiddenFileInput
              id={inputId}
              type="file"
              accept=".xlsx,.csv"
              onChange={(event) => void chooseFile(event)}
            />
            <span>
              {step.kind === 'choose' ? 'Excel (.xlsx) or CSV, up to 10,000 rows' : step.fileName}
            </span>
          </FileRow>
        </Section>

        <StepResult step={step} />
        {save.error && <InlineAlert>{save.error.message}</InlineAlert>}
      </Steps>
    </Dialog>
  );
}

function StepResult({ step }: { step: Step }) {
  switch (step.kind) {
    case 'choose':
      return null;
    case 'checking':
      return <LoadingState label="Checking the file…" />;
    case 'fileError':
      return <InlineAlert>{step.message}</InlineAlert>;
    case 'checked':
      return <CheckSummary result={step.result} />;
  }
}

function CheckSummary({ result }: { result: ImportCheckResult }) {
  if (result.errorCount === 0) {
    return (
      <Ready role="status">
        <strong>{formatNumber(result.toCreate + result.toUpdate)} rows ready:</strong>{' '}
        {formatNumber(result.toCreate)} new, {formatNumber(result.toUpdate)} updates.
      </Ready>
    );
  }
  const notShown = result.errorCount - result.errors.length;
  return (
    <Problems role="alert">
      <strong>
        {formatNumber(result.errorCount)} {result.errorCount === 1 ? 'problem' : 'problems'} to fix.
        Nothing has been imported — fix the file and choose it again.
      </strong>
      <ul aria-label="Problems in the file">
        {result.errors.map((error) => (
          <li key={`${error.rowNumber}-${error.column}`}>
            Row {error.rowNumber} · {error.column}: {error.message}
          </li>
        ))}
        {notShown > 0 && <li>…and {formatNumber(notShown)} more</li>}
      </ul>
    </Problems>
  );
}

const Steps = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const Section = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`;

const Rules = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  li + li {
    margin-top: ${({ theme }) => theme.spacing.xs};
  }
`;

const FileRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const FileLabel = styled.label`
  display: inline-flex;
  align-items: center;
  min-height: ${({ theme }) => theme.layout.controlHeight};
  padding: 0 ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  /* The real input is hidden, so show its keyboard focus on the label. */
  &:has(+ input:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.colors.focusRing};
    outline-offset: 2px;
  }
`;

/** Visually hidden but still focusable and clickable through its label. */
const HiddenFileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
`;

const Ready = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-left: 4px solid ${({ theme }) => theme.colors.success};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.successSurface};
`;

const Problems = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-left: 4px solid ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.dangerSurface};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  ul {
    max-height: 16rem;
    margin: ${({ theme }) => theme.spacing.sm} 0 0;
    padding-left: ${({ theme }) => theme.spacing.xl};
    overflow-y: auto;
  }
`;
