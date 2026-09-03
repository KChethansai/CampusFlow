// Button: themed button built from shared style tokens.
import { btnClass } from '../../styles/common';

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${btnClass(variant, size)} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
