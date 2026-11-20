import { useId } from 'react';
import styled from 'styled-components';
import { controlStyles, FieldLabel } from './form-controls';
import { SearchIcon } from './icons';

interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchField({ label, value, onChange, placeholder }: SearchFieldProps) {
  const id = useId();

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputWrapper>
        <IconSlot>
          <SearchIcon />
        </IconSlot>
        <Input
          id={id}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </InputWrapper>
    </div>
  );
}

const InputWrapper = styled.div`
  position: relative;
`;

const IconSlot = styled.span`
  position: absolute;
  top: 50%;
  left: ${({ theme }) => theme.spacing.md};
  display: flex;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textMuted};
  pointer-events: none;
`;

const Input = styled.input`
  ${controlStyles}
  padding-left: 2.5rem;
`;
