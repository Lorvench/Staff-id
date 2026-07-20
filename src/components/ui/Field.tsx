import { forwardRef } from "react";

const CONTROL =
  "w-full rounded-xl border border-paper-sunken bg-paper-soft px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-paper focus:ring-2 focus:ring-brand/20 disabled:opacity-60";

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="field-label block">
      {children}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-disengaged">{children}</p>;
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = "", ...rest },
  ref,
) {
  return (
    <div>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error) || undefined}
        className={`${label ? "mt-2" : ""} ${CONTROL} ${
          error ? "border-disengaged focus:border-disengaged focus:ring-disengaged/20" : ""
        } ${className}`}
        {...rest}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, id, className = "", children, ...rest },
  ref,
) {
  return (
    <div>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <select
        ref={ref}
        id={id}
        className={`${label ? "mt-2" : ""} ${CONTROL} cursor-pointer ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
});
