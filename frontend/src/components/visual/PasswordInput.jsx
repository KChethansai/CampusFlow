import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn, inputClass, labelClass } from '../../system/tokens';

const glassField =
  'border border-[var(--cf-line)] rounded-[14px] focus:border-[#D86D3E] focus:ring-[3px] focus:ring-[#D86D3E]/30 focus:outline-none';
const glassError = 'border-[#FF5964] focus:border-[#FF5964] focus:ring-[#FF5964]/30';

/**
 * PasswordInput
 * Accessible password field with reveal toggle and Obsidian Ember focus ring.
 */
const PasswordInput = forwardRef(function PasswordInput(
  { label = 'Password', error, id = 'password', className, placeholder = 'Enter your password', ...props },
  ref
) {
  const [show, setShow] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={cn(
            inputClass,
            glassField,
            'pr-11',
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
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)] hover:bg-black/[0.05] dark:hover:bg-white/10 transition"
        >
          {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs font-medium text-[#FF5964]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default PasswordInput;
