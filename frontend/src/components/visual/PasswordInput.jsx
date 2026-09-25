import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn, inputClass, labelClass } from '../../system/tokens';

const glassField =
  'border border-[var(--cf-line)] rounded-[14px] focus:border-[var(--cf-accent)] focus:ring-[3px] focus:ring-[var(--cf-focus)] focus:outline-none';
const glassError = 'border-[var(--cf-danger)] focus:border-[var(--cf-danger)] focus:ring-[var(--cf-focus)]';

/**
 * PasswordInput
 * Accessible password field with reveal toggle and semantic focus ring.
 */
const PasswordInput = forwardRef(function PasswordInput(
  { label = 'Password', error, id, className, placeholder = 'Enter your password', 'aria-describedby': describedBy, ...props },
  ref
) {
  const [show, setShow] = useState(false);
  const auto = useId();
  const fieldId = id || `cf-password-${auto.replace(/:/g, '')}`;
  const errorId = `${fieldId}-error`;

  return (
    <div>
      {label && (
        <label htmlFor={fieldId} className={labelClass}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={fieldId}
          ref={ref}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? (describedBy ? `${errorId} ${describedBy}` : errorId) : describedBy}
          className={cn(
            inputClass,
            glassField,
            'pr-12',
            error && glassError,
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          title={show ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 min-w-9 min-h-9 grid place-items-center rounded-lg text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)] hover:bg-black/[0.05] dark:hover:bg-white/10 transition"
        >
          {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-[var(--cf-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default PasswordInput;
