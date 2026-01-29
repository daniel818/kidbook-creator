'use client';

import { useTranslation } from 'react-i18next';
import { PricingCard } from '@/components/PricingCard';
import styles from './PricingMatrix.module.css';

interface PricingMatrixProps {
  currency: 'USD' | 'EUR' | 'ILS';
}

const PRICING = {
  USD: {
    symbol: '$',
    digital: 15,
    printed: 45
  },
  EUR: {
    symbol: '€',
    digital: 14,
    printed: 42
  },
  ILS: {
    symbol: '₪',
    digital: 55,
    printed: 165
  }
};

export function PricingMatrix({ currency }: PricingMatrixProps) {
  const { t } = useTranslation('pricing');
  const pricing = PRICING[currency];

  return (
    <div className={styles.matrix}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('title')}</h2>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>{t('matrix.digital')}</h3>
          <div className={styles.cards}>
            <PricingCard
              type="digital"
              quantity={1}
              pricePerBook={pricing.digital}
              currency={currency}
              currencySymbol={pricing.symbol}
            />
          </div>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>{t('matrix.printed')}</h3>
          <div className={styles.cards}>
            <PricingCard
              type="printed"
              quantity={1}
              pricePerBook={pricing.printed}
              currency={currency}
              currencySymbol={pricing.symbol}
            />
          </div>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.featureColumn}>
          <h4 className={styles.featureTitle}>{t('features.digitalIncludes')}</h4>
          <ul className={styles.featureList}>
            <li>{t('features.digitalFeature1')}</li>
            <li>{t('features.digitalFeature2')}</li>
            <li>{t('features.digitalFeature3')}</li>
          </ul>
        </div>
        <div className={styles.featureColumn}>
          <h4 className={styles.featureTitle}>{t('features.printedIncludes')}</h4>
          <ul className={styles.featureList}>
            <li>{t('features.printedFeature1')}</li>
            <li>{t('features.printedFeature2')}</li>
            <li>{t('features.printedFeature3')}</li>
          </ul>
        </div>
      </div>

      <div className={styles.disclaimers}>
        <p className={styles.disclaimer}>
          * {t('disclaimers.shipping')}
        </p>
        <p className={styles.disclaimer}>
          * {t('disclaimers.tax')}
        </p>
      </div>
    </div>
  );
}
