import React from 'react';
import styles from './PageHeader.module.css';

export const PageHeader = ({ title, subtitle, action, breadcrumbs, className = '' }) => {
  return (
    <div className={`${styles.header} ${className}`}>
      {breadcrumbs && <div className={styles.breadcrumbs}>{breadcrumbs}</div>}
      <div className={styles.titleRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {action && <div className={styles.actionGroup}>{action}</div>}
      </div>
    </div>
  );
};
