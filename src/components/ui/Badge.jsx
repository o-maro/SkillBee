import React from 'react';
import styles from './Badge.module.css';

export const Badge = ({ children, variant = 'primary', className = '', ...props }) => {
  const variantClass = styles[variant] || styles.primary;
  
  return (
    <span className={`${styles.badge} ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
};
