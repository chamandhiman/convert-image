import styles from './Button.module.css';

/**
 * Reusable Button component implementing the global design system hierarchy.
 *
 * @param {'primary' | 'secondary' | 'tertiary'} variant - Action hierarchy level
 * @param {'sm' | 'md' | 'lg'} size - Height & padding scale
 * @param {React.ReactNode} icon - Icon component to display
 * @param {'left' | 'right'} iconPosition - Icon side
 * @param {boolean} fullWidth - Stretch to 100% width
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const sizeClass =
    size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  const variantClass =
    variant === 'secondary'
      ? styles.variantSecondary
      : variant === 'tertiary' || variant === 'subtle'
        ? styles.variantTertiary
        : styles.variantPrimary;

  const combinedClass = [
    styles.btn,
    sizeClass,
    variantClass,
    fullWidth ? styles.fullWidth : '',
    disabled ? styles.btnDisabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={combinedClass} disabled={disabled} {...props}>
      {icon && iconPosition === 'left' && <span className={styles.btnIcon}>{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className={styles.btnIcon}>{icon}</span>}
    </button>
  );
}

export default Button;
