import {
  countryName,
  currencyName,
  currencyOf,
  sortByCountryName,
  WORLD_CURRENCIES,
  type Country,
} from '@acme/shared';
import { useId, useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '../../components/Button';
import { Dialog, type DialogVisibility } from '../../components/Dialog';
import { InlineAlert } from '../../components/InlineAlert';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { ApiError } from '../../services/http-client';
import { useAddCountry } from './use-countries';

const WORLD_COUNTRY_CODES = sortByCountryName(Object.keys(WORLD_CURRENCIES));

interface AddCountryDialogProps extends DialogVisibility {
  /** Countries already set up: not offered again, and their currencies already have a rate. */
  existing: readonly Country[];
  onAdded: (country: Country) => void;
}

/**
 * Pick a country from the world list; its currency is filled in. An exchange rate is asked for only
 * when no set-up country uses that currency yet (e.g. adding France reuses the euro rate).
 */
export function AddCountryDialog({ existing, onAdded, ...visibility }: AddCountryDialogProps) {
  const formId = useId();
  const addCountry = useAddCountry();
  const [code, setCode] = useState('');
  const [usdRate, setUsdRate] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ code?: string; usdRate?: string }>({});

  const existingCodes = new Set(existing.map((country) => country.code));
  const knownCurrencies = new Set(existing.map((country) => country.currency));
  const options = WORLD_COUNTRY_CODES.filter((candidate) => !existingCodes.has(candidate)).map(
    (candidate) => ({ value: candidate, label: countryName(candidate) }),
  );
  const currency = code ? currencyOf(code) : undefined;
  const needsRate = currency !== undefined && !knownCurrencies.has(currency);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rate = Number(usdRate);
    const errors = {
      code: code ? undefined : 'Choose a country',
      usdRate: needsRate && !(rate > 0) ? 'Enter a rate greater than 0, e.g. 0.0077' : undefined,
    };
    setFieldErrors(errors);
    if (errors.code || errors.usdRate) return;

    addCountry.mutate(needsRate ? { code, usdRate: rate } : { code }, {
      onSuccess: (country) => {
        onAdded(country);
        visibility.onClose();
      },
      onError: (error) => {
        if (!(error instanceof ApiError)) return;
        const usdRateError = error.details.find((detail) => detail.field === 'usdRate');
        if (usdRateError) setFieldErrors({ usdRate: usdRateError.message });
      },
    });
  }

  const unhandledError =
    addCountry.error && !fieldErrors.usdRate ? addCountry.error.message : undefined;

  return (
    <Dialog
      {...visibility}
      variant="centered"
      title="Add a country"
      footer={
        <>
          <Button onClick={visibility.onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form={formId} disabled={addCountry.isPending}>
            {addCountry.isPending ? 'Adding…' : 'Add country'}
          </Button>
        </>
      }
    >
      <Form id={formId} onSubmit={submit} noValidate>
        {unhandledError && <InlineAlert>{unhandledError}</InlineAlert>}
        <SelectField
          label="Country"
          emptyOptionLabel="Choose a country"
          options={options}
          value={code}
          error={fieldErrors.code}
          hint={currency ? `Paid in ${currencyName(currency)} (${currency})` : undefined}
          onChange={(event) => {
            setCode(event.target.value);
            setFieldErrors({});
          }}
        />
        {needsRate && (
          <TextField
            label={`Exchange rate: 1 ${currency} = ? USD`}
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="e.g. 0.0077"
            value={usdRate}
            error={fieldErrors.usdRate}
            hint={`Used to compare pay in US dollars. No other country uses ${currency} yet.`}
            onChange={(event) => setUsdRate(event.target.value)}
          />
        )}
      </Form>
    </Dialog>
  );
}

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
`;
