import type { ComponentProps } from 'react';
import styled from 'styled-components';
import { controlStyles, FieldLabel, useFieldMessages } from './form-controls';

export interface SelectOption {
  value: string;
  label: string;
}

type SelectFieldProps = Omit<ComponentProps<'select'>, 'children'> & {
  label: string;
  options: readonly SelectOption[];
  /** Adds a first option with value "" (e.g. "All countries"). */
  emptyOptionLabel?: string;
  hint?: string | undefined;
  error?: string | undefined;
};

/** A labelled native <select>: accessible and mobile-friendly out of the box. */
export function SelectField({
  label,
  options,
  emptyOptionLabel,
  hint,
  error,
  id,
  ...selectProps
}: SelectFieldProps) {
  const { controlId, controlProps, messages } = useFieldMessages({ id, hint, error });

  return (
    <div>
      <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
      <Select {...selectProps} {...controlProps}>
        {emptyOptionLabel !== undefined && <option value="">{emptyOptionLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {messages}
    </div>
  );
}

const Select = styled.select`
  ${controlStyles}
  cursor: pointer;
`;
