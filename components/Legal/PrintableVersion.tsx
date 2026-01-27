import styles from './LegalPage.module.css';

interface PrintableVersionProps {
  data: any;
  type: 'terms' | 'privacy';
}

export function PrintableVersion({ data, type }: PrintableVersionProps) {
  // This component can be used for generating PDF versions
  // For now, it's a placeholder that can be enhanced later
  return (
    <div className={styles.printableVersion}>
      <h2>Printable Version</h2>
      <p>This feature will allow users to download a PDF version of this document.</p>
    </div>
  );
}
