import { LegalSectionData } from '@/lib/legal/types';
import styles from './LegalPage.module.css';

interface LegalSectionProps {
  id: string;
  section: LegalSectionData;
  isExpanded: boolean;
  onToggle: () => void;
}

export function LegalSection({ id, section, isExpanded, onToggle }: LegalSectionProps) {
  const renderSubsections = () => {
    if (!section) return null;

    const subsections = Object.entries(section).filter(([key]) => 
      key !== 'title' && key !== 'content' && typeof section[key] === 'object'
    );

    if (subsections.length === 0) return null;

    return (
      <div className={styles.subsections}>
        {subsections.map(([key, subsection]: [string, any]) => {
          // Check if subsection has any actual content beyond just a title
          const hasContent = subsection.content || 
                           subsection.examples || 
                           subsection.measures || 
                           subsection.purposes || 
                           subsection.categories;
          
          // Don't render empty subsections
          if (!hasContent) return null;
          
          return (
            <div key={key} className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>{subsection.title}</h4>
              {subsection.content && (
                <p className={styles.subsectionContent}>{subsection.content}</p>
              )}
              
              {/* Handle nested content like examples, measures, etc. */}
              {subsection.examples && (
                <ul className={styles.examplesList}>
                  {subsection.examples.map((example: string, index: number) => (
                    <li key={index} className={styles.exampleItem}>{example}</li>
                  ))}
                </ul>
              )}
              
              {subsection.measures && (
                <ul className={styles.measuresList}>
                  {subsection.measures.map((measure: string, index: number) => (
                    <li key={index} className={styles.measureItem}>{measure}</li>
                  ))}
                </ul>
              )}
              
              {subsection.purposes && (
                <div className={styles.purposes}>
                  {subsection.purposes.map((purpose: any, index: number) => (
                    <div key={index} className={styles.purpose}>
                      <h5 className={styles.purposeTitle}>{purpose.title}</h5>
                      <p className={styles.purposeDescription}>{purpose.description}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {subsection.categories && (
                <div className={styles.categories}>
                  {Object.entries(subsection.categories).map(([catKey, category]: [string, any]) => (
                    <div key={catKey} className={styles.category}>
                      <h5 className={styles.categoryTitle}>{category.title}</h5>
                      <p className={styles.categoryDescription}>{category.description}</p>
                      {category.examples && (
                        <ul className={styles.examplesList}>
                          {category.examples.map((example: string, idx: number) => (
                            <li key={idx} className={styles.exampleItem}>{example}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section id={id} className={styles.legalSection}>
      <div className={styles.sectionHeader} onClick={onToggle}>
        <h2 className={styles.sectionTitle}>{section.title}</h2>
        <button className={styles.toggleButton} aria-expanded={isExpanded}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      
      <div className={`${styles.sectionContent} ${isExpanded ? styles.expanded : ''}`}>
        {section.content && (
          <div className={styles.mainContent}>
            <p className={styles.sectionText}>{section.content}</p>
          </div>
        )}
        
        {renderSubsections()}
      </div>
    </section>
  );
}
