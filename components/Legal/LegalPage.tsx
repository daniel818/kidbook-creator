'use client';

import { useState } from 'react';
import { TermsData, PrivacyData, LegalPageType } from '@/lib/legal/types';
import { TableOfContents } from './TableOfContents';
import { LegalSection } from './LegalSection';
import { PrintableVersion } from './PrintableVersion';
import styles from './LegalPage.module.css';

interface LegalPageProps {
  data: TermsData | PrivacyData;
  type: LegalPageType;
}

export function LegalPage({ data, type }: LegalPageProps) {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    const allSectionIds = type === 'terms' 
      ? Object.keys((data as TermsData).sections)
      : Object.keys(data).filter(key => key !== 'meta');
    setExpandedSections(new Set(allSectionIds));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const renderContent = () => {
    if (type === 'terms') {
      const termsData = data as TermsData;
      return (
        <>
          {Object.entries(termsData.sections).map(([key, section]) => (
            <LegalSection
              key={key}
              id={key}
              section={section}
              isExpanded={expandedSections.has(key)}
              onToggle={() => toggleSection(key)}
            />
          ))}
        </>
      );
    } else {
      const privacyData = data as PrivacyData;
      return (
        <>
          {Object.entries(privacyData).map(([key, section]) => {
            if (key === 'meta') return null;
            return (
              <LegalSection
                key={key}
                id={key}
                section={section as any}
                isExpanded={expandedSections.has(key)}
                onToggle={() => toggleSection(key)}
              />
            );
          })}
        </>
      );
    }
  };

  return (
    <main className={`${styles.legalPage} ${isPrintMode ? styles.printMode : ''}`}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{data.meta.title}</h1>
          <div className={styles.meta}>
            <span className={styles.version}>{data.meta.version}</span>
            <span className={styles.lastUpdated}>{data.meta.lastUpdated}</span>
          </div>
        </div>

        {!isPrintMode && (
          <div className={styles.controls}>
            <div className={styles.sectionControls}>
              <button onClick={expandAll} className={styles.controlButton}>
                Expand All
              </button>
              <button onClick={collapseAll} className={styles.controlButton}>
                Collapse All
              </button>
            </div>
            <div className={styles.actionControls}>
              <button onClick={handlePrint} className={styles.printButton}>
                🖨️ Print
              </button>
            </div>
          </div>
        )}

        <div className={styles.content}>
          {!isPrintMode && (
            <aside className={styles.sidebar}>
              <TableOfContents
                data={data}
                type={type}
                expandedSections={expandedSections}
                onSectionClick={toggleSection}
              />
            </aside>
          )}
          
          <div className={styles.mainContent}>
            {renderContent()}
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerNote}>
            This document is legally binding. Please read it carefully.
          </p>
        </div>
      </div>
    </main>
  );
}
