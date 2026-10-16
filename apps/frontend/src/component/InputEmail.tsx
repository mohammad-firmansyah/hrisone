interface InputEmailProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function InputEmail({
  value,
  onChange,
  placeholder = 'Email address',
  disabled = false,
  required = true,
  className = '',
}: InputEmailProps) {
  return (
    <input
      type="email"
      className={`form-input ${className}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoComplete="email"
    />
  );
}
