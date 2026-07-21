"use client";

import { forwardRef, useState } from "react";

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

type PasswordInputProps = Omit<InputProps, "type">;

/**
 * Password field with a reveal toggle.
 *
 * The toggle is a real `<button>` inside the field, excluded from the tab order
 * so it never sits between two password fields during keyboard entry — it's
 * reachable, just not in the way. `aria-pressed` carries the current state, and
 * the input's `autoComplete` is left to the caller so password managers still
 * behave.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, id, className = "", ...rest }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div>
        {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}

        <div className={`relative ${label ? "mt-2" : ""}`}>
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            aria-invalid={Boolean(error) || undefined}
            className={`${CONTROL} pr-12 ${
              error ? "border-disengaged focus:border-disengaged focus:ring-disengaged/20" : ""
            } ${className}`}
            {...rest}
          />

          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-ink-muted transition-colors hover:text-ink"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        <FieldError>{error}</FieldError>
      </div>
    );
  },
);

const eyeProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const EyeIcon = () => (
  <svg {...eyeProps}>
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

const EyeOffIcon = () => (
  <svg {...eyeProps}>
    <path d="M9.9 5.7A9.9 9.9 0 0112 5.5c6.5 0 10 6.5 10 6.5a17 17 0 01-3.2 4.1M6.3 7.9A17 17 0 002 12s3.5 6.5 10 6.5c1.7 0 3.2-.4 4.5-1.1" />
    <path d="M10 10a2.8 2.8 0 004 4" />
    <path d="M3 3l18 18" />
  </svg>
);

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
