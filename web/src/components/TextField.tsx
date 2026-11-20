import type { ComponentProps } from 'react';
import styled from 'styled-components';
import { controlStyles, FieldLabel, useFieldMessages } from './form-controls';

type TextFieldProps = ComponentProps<'input'> & {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
};

/** A labelled <input> with optional hint and error. Accepts all native input props (incl. React Hook Form's register). */
export function TextField({ label, hint, error, id, ...inputProps }: TextFieldProps) {
  const { controlId, controlProps, messages } = useFieldMessages({ id, hint, error });

  return (
    <div>
      <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
      <Input {...inputProps} {...controlProps} />
      {messages}
    </div>
  );
}

const Input = styled.input`
  ${controlStyles}
`;
