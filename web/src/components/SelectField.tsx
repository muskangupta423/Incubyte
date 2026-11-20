import { useId } from 'react';
import styled from 'styled-components';
import { controlStyles, FieldLabel } from './form-controls';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  /** Adds a first option with value "" (e.g. "All countries"). */
  emptyOptionLabel?: string;
}

/** A labelled native <select>: accessible and mobile-friendly out of the box. */
export function SelectField({
  label,
  value,
  options,
  onChange,
  emptyOptionLabel,
}: SelectFieldProps) {
  const id = useId();

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {emptyOptionLabel !== undefined && <option value="">{emptyOptionLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

const Select = styled.select`
  ${controlStyles}
  cursor: pointer;
`;
