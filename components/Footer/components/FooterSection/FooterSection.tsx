import React from 'react';
import styles from './FooterSection.module.css';

interface FooterSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function FooterSection({ title, children, className = '' }: FooterSectionProps) {
  return (
    <div className={`${styles.section} ${className}`}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
