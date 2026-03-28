import React from 'react';
import styles from './Button.module.css';

export const Button = ({ children, className = '', variant = 'primary', size = 'default', ...props }) => {
  const variantClass = styles[variant] || styles.primary;
  const sizeClass = styles[size] || '';
  
  return (
    <button 
      className={`${styles.button} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
