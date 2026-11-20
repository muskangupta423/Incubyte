import {
  countryName,
  employeeInputSchema,
  type Employee,
  type EmployeeInput,
  type EmployeeInputDraft,
} from '@acme/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { useController, useForm, type DefaultValues, type UseFormSetError } from 'react-hook-form';
import styled from 'styled-components';
import { useDialog } from '../../components/Dialog';
import { InlineAlert } from '../../components/InlineAlert';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { ApiError } from '../../services/http-client';
import { AddCountryDialog } from '../countries/AddCountryDialog';
import { useCountries } from '../countries/use-countries';
import { useFilterOptions } from './use-employee-queries';

/** The last option of the Country dropdown; choosing it opens "Add a country" instead of selecting. */
const ADD_COUNTRY = '__add-country__';

const EMPTY_FORM: DefaultValues<EmployeeInputDraft> = {
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
  const { data: countries = [] } = useCountries();
  const addCountryDialog = useDialog();
  const [formError, setFormError] = useState<string | null>(null);
  const jobTitleListId = useId();
  const departmentListId = useId();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitted },
  } = useForm<EmployeeInputDraft, unknown, EmployeeInput>({
    resolver: zodResolver(employeeInputSchema),
    defaultValues: employee ? toFormValues(employee) : EMPTY_FORM,
  });

  // Controlled (not register) because one option opens a dialog instead of being selected.
  const { field: countryField } = useController({ control, name: 'country' });
  const chooseCountry = (code: string) =>
    countryField.onChange(code, { shouldValidate: isSubmitted });
  // Show the currency as soon as a country is picked (the API derives it the same way).
  const currency = countries.find((country) => country.code === countryField.value)?.currency;
  const countryOptions = [
    ...countries.map((country) => ({ value: country.code, label: countryName(country.code) })),
    { value: ADD_COUNTRY, label: '+ Add another country' },
  ];

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
    <>
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
          {/* Assigned by the system and never changed, so it is shown but not editable. */}
          <TextField
            label="Employee code"
            readOnly
            value={employee?.employeeCode ?? ''}
            placeholder="Assigned automatically"
            hint={
              employee ? "Codes can't be changed" : 'The next free code is assigned when you save'
            }
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
            options={countryOptions}
            hint={currency ? `Paid in ${currency}` : 'The currency is set from the country'}
            error={errors.country?.message}
            {...countryField}
            onChange={(event) => {
              if (event.target.value === ADD_COUNTRY) addCountryDialog.show();
              else chooseCountry(event.target.value);
            }}
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

      {/* Outside the <form>: the dialog has a form of its own, and forms can't be nested. */}
      {addCountryDialog.isShown && (
        <AddCountryDialog
          {...addCountryDialog.visibility}
          existing={countries}
          // The new country is selected straight away: it was added for this employee.
          onAdded={(country) => chooseCountry(country.code)}
        />
      )}
    </>
  );
}

function toFormValues(employee: Employee): EmployeeInputDraft {
  return {
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
