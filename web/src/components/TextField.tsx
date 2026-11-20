import type { ComponentProps } from 'react';
import styled from 'styled-components';
import {
  controlStyles,
  DropdownArrow,
  dropdownControlStyles,
  FieldLabel,
  useFieldMessages,
} from './form-controls';

type TextFieldProps = ComponentProps<'input'> & {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
};

/**
 * A labelled <input> with optional hint and error. Accepts all native input props (incl. React Hook Form's register).
 * With `list` (suggestions from a <datalist>) it shows the same dropdown arrow as a select, so it reads as
 * "pick one — or type a new value".
 */
export function TextField({ label, hint, error, id, ...inputProps }: TextFieldProps) {
  const { controlId, controlProps, messages } = useFieldMessages({ id, hint, error });
  const input = <Input {...inputProps} {...controlProps} />;

  return (
    <div>
      <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
      {inputProps.list ? <DropdownArrow>{input}</DropdownArrow> : input}
      {messages}
    </div>
  );
}

const Input = styled.input`
  ${controlStyles}

  &[list] {
    ${dropdownControlStyles}
  }
`;
