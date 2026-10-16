interface InputPasswordProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function InputPassword({
  value,
  onChange,
  placeholder = 'Password',
  disabled = false,
  required = true,
  className = '',
}: InputPasswordProps) {
  return (
    <input
      type="password"
      className={`form-input ${className}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoComplete="current-password"
    />
  );
}
