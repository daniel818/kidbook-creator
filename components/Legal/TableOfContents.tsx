import { TermsData, PrivacyData, LegalPageType } from '@/lib/legal/types';
import styles from './LegalPage.module.css';

interface TableOfContentsProps {
  data: TermsData | PrivacyData;
  type: LegalPageType;
  expandedSections: Set<string>;
  onSectionClick: (sectionId: string) => void;
}

export function TableOfContents({ data, type, expandedSections, onSectionClick }: TableOfContentsProps) {
  const getSections = () => {
    if (type === 'terms') {
      const termsData = data as TermsData;
      return Object.entries(termsData.sections).map(([key, section]) => ({
        id: key,
        title: section.title,
      }));
    } else {
      const privacyData = data as PrivacyData;
      return Object.entries(privacyData)
        .filter(([key]) => key !== 'meta')
        .map(([key, section]) => ({
          id: key,
          title: (section as any).title,
        }));
    }
  };

  const sections = getSections();

  return (
    <nav className={styles.tableOfContents}>
      <h3 className={styles.tocTitle}>Table of Contents</h3>
      <ul className={styles.tocList}>
        {sections.map((section) => (
          <li key={section.id} className={styles.tocItem}>
            <a
              href={`#${section.id}`}
              className={`${styles.tocLink} ${expandedSections.has(section.id) ? styles.expanded : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onSectionClick(section.id);
                const element = document.getElementById(section.id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
