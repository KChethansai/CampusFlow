// Input: labeled input built from shared style tokens; supports react-hook-form spread.
import { formGroup, inputClass, labelClass } from '../../styles/common';

function Input({ label, type = 'text', id, placeholder, required, className = '', error, ...props }) {
  return (
    <div className={formGroup}>
      {label && (
        <label htmlFor={id} className={labelClass}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        className={`${inputClass} ${error ? 'border-red-300' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default Input;
