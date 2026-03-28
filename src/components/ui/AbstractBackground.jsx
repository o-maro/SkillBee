import React from 'react';
import styles from './AbstractBackground.module.css';

export const AbstractBackground = () => {
  return (
    <div className={styles.backgroundContainer}>
      <div className={`${styles.blob} ${styles.blobPrimary}`}></div>
      <div className={`${styles.blob} ${styles.blobSecondary}`}></div>
      <div className={`${styles.blob} ${styles.blobTertiary}`}></div>
      <div className={styles.glassLayer}></div>
    </div>
  );
};
