import React from 'react';
import styles from './Card.module.css';

export const Card = ({ children, className = '', hoverable = false, ...props }) => {
  return (
    <div 
      className={`${styles.card} ${hoverable ? styles.hoverable : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
