import React from 'react';
import styles from './Input.module.css';

export const Input = ({ label, id, error, className = '', containerClassName = '', ...props }) => {
  const inputId = id || Math.random().toString(36).substr(2, 9);
  
  return (
    <div className={`${styles.inputContainer} ${containerClassName}`}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <input 
        id={inputId}
        className={`${styles.input} ${error ? styles.errorInput : ''} ${className}`}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
