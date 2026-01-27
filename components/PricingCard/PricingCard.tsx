'use client';

import { useTranslation } from 'react-i18next';
import styles from './PricingCard.module.css';

interface PricingCardProps {
  type: 'digital' | 'printed';
  quantity: 1 | 2 | 3;
  pricePerBook: number;
  currency: string;
  currencySymbol: string;
  showBestValue?: boolean;
}

export function PricingCard({ 
  type, 
  quantity, 
  pricePerBook, 
  currency,
  currencySymbol,
  showBestValue = false 
}: PricingCardProps) {
  const { t } = useTranslation('pricing');
  
  const totalPrice = pricePerBook * quantity;
  const quantityLabel = quantity === 1 ? 'single' : quantity === 2 ? 'double' : 'triple';
  const bookLabel = quantity === 1 ? t('matrix.book') : t('matrix.books');

  return (
    <div className={`${styles.card} ${showBestValue ? styles.bestValue : ''}`}>
      {showBestValue && (
        <div className={styles.badge}>
          <span className={styles.badgeText}>{t('matrix.bestValue')}</span>
        </div>
      )}
      
      <div className={styles.header}>
        <h3 className={styles.title}>
          {t(`matrix.${quantityLabel}`)}
        </h3>
        <p className={styles.subtitle}>
          {quantity} {bookLabel}
        </p>
      </div>

      <div className={styles.pricing}>
        <div className={styles.pricePerBook}>
          <span className={styles.amount}>{currencySymbol}{pricePerBook}</span>
          <span className={styles.perBook}>{t('matrix.perBook')}</span>
        </div>
        
        {quantity > 1 && (
          <div className={styles.total}>
            {currencySymbol}{totalPrice} {t('matrix.total')}
          </div>
        )}
      </div>

      <div className={styles.type}>
        {type === 'digital' ? t('matrix.digital') : t('matrix.printed')}
      </div>
    </div>
  );
}
