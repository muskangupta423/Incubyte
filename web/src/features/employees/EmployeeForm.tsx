import {
  COUNTRIES,
  COUNTRY_CODES,
  countryName,
  employeeInputSchema,
  isCountryCode,
  type Employee,
  type EmployeeInput,
  type EmployeeInputDraft,
} from '@acme/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { useForm, useWatch, type DefaultValues, type UseFormSetError } from 'react-hook-form';
import styled from 'styled-components';
import { InlineAlert } from '../../components/InlineAlert';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { ApiError } from '../../services/http-client';
import { useFilterOptions } from './use-employee-queries';

const COUNTRY_OPTIONS = COUNTRY_CODES.map((code) => ({
  value: code,
  label: countryName(code),
})).sort((a, b) => a.label.localeCompare(b.label));

const EMPTY_FORM: DefaultValues<EmployeeInputDraft> = {
  employeeCode: '',
  fullName: '',
  email: '',
  jobTitle: '',
  department: '',
  country: '',
  hireDate: '',
};

interface EmployeeFormProps {
  /** Lets a submit button outside the <form> (in the dialog footer) submit it. */
  formId: string;
  /** Pre-fills the form when editing; omit to add a new employee. */
  employee?: Employee | undefined;
  onSubmit: (input: EmployeeInput) => Promise<Employee>;
  onSaved: (employee: Employee) => void;
}

/**
 * Validates with the same Zod schema as the API, so the browser and the server always agree
 * on the rules and the messages. Errors the server still finds (e.g. a duplicate email)
 * are shown under the matching field.
 */
export function EmployeeForm({ formId, employee, onSubmit, onSaved }: EmployeeFormProps) {
  const { data: filterOptions } = useFilterOptions();
  const [formError, setFormError] = useState<string | null>(null);
  const jobTitleListId = useId();
  const departmentListId = useId();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<EmployeeInputDraft, unknown, EmployeeInput>({
    resolver: zodResolver(employeeInputSchema),
    defaultValues: employee ? toFormValues(employee) : EMPTY_FORM,
  });

  // Show the currency as soon as a country is picked (the API derives it the same way).
  const countryCode = useWatch({ control, name: 'country' }).toUpperCase();
  const currency = isCountryCode(countryCode) ? COUNTRIES[countryCode].currency : undefined;

  const submit = handleSubmit(async (input) => {
    setFormError(null);
    try {
      onSaved(await onSubmit(input));
    } catch (error) {
      if (!showFieldErrors(error, setError)) {
        setFormError(
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        );
      }
    }
  });

  return (
    <form id={formId} onSubmit={(event) => void submit(event)} noValidate>
      {formError && <InlineAlert>{formError}</InlineAlert>}

      <Grid>
        <Wide>
          <TextField
            label="Full name"
            autoComplete="off"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
        </Wide>
        <Wide>
          <TextField
            label="Email"
            type="email"
            autoComplete="off"
            error={errors.email?.message}
            {...register('email')}
          />
        </Wide>
        <TextField
          label="Employee code"
          hint="e.g. EMP-00042"
          error={errors.employeeCode?.message}
          {...register('employeeCode')}
        />
        <TextField
          label="Hire date"
          type="date"
          error={errors.hireDate?.message}
          {...register('hireDate')}
        />
        <TextField
          label="Job title"
          list={jobTitleListId}
          error={errors.jobTitle?.message}
          {...register('jobTitle')}
        />
        <TextField
          label="Department"
          list={departmentListId}
          error={errors.department?.message}
          {...register('department')}
        />
        <SelectField
          label="Country"
          emptyOptionLabel="Choose a country"
          options={COUNTRY_OPTIONS}
          hint={currency ? `Paid in ${currency}` : 'The currency is set from the country'}
          error={errors.country?.message}
          {...register('country')}
        />
        <TextField
          label={currency ? `Annual salary (${currency})` : 'Annual salary'}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          error={errors.annualSalary?.message}
          {...register('annualSalary', { valueAsNumber: true })}
        />
      </Grid>

      {/* Suggestions from existing data; new values are still allowed. */}
      <datalist id={jobTitleListId}>
        {filterOptions?.jobTitles.map((title) => (
          <option key={title} value={title} />
        ))}
      </datalist>
      <datalist id={departmentListId}>
        {filterOptions?.departments.map((department) => (
          <option key={department} value={department} />
        ))}
      </datalist>
    </form>
  );
}

function toFormValues(employee: Employee): EmployeeInputDraft {
  return {
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    email: employee.email,
    jobTitle: employee.jobTitle,
    department: employee.department,
    country: employee.country,
    annualSalary: employee.annualSalary,
    hireDate: employee.hireDate,
  };
}

const FORM_FIELDS: readonly string[] = employeeInputSchema.keyof().options;

function isFormField(field: string): field is keyof EmployeeInputDraft {
  return FORM_FIELDS.includes(field);
}

/** Puts server validation/conflict messages under their fields. Returns false if none matched a field. */
function showFieldErrors(error: unknown, setError: UseFormSetError<EmployeeInputDraft>): boolean {
  if (!(error instanceof ApiError)) return false;
  let shown = false;
  for (const detail of error.details) {
    if (isFormField(detail.field)) {
      setError(detail.field, { type: 'server', message: detail.message });
      shown = true;
    }
  }
  return shown;
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr 1fr;
  }
`;

const Wide = styled.div`
  grid-column: 1 / -1;
`;
