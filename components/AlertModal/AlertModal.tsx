'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styles from './AlertModal.module.css';

export type AlertType = 'warning' | 'error' | 'success' | 'info';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    type?: AlertType;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    showDontAskAgain?: boolean;
    onDontAskAgainChange?: (checked: boolean) => void;
    isLoading?: boolean;
}

const iconMap: Record<AlertType, string> = {
    warning: '⚠️',
    error: '❌',
    success: '✅',
    info: 'ℹ️'
};

export function AlertModal({
    isOpen,
    onClose,
    onConfirm,
    type = 'warning',
    title,
    message,
    confirmText,
    cancelText,
    showCancel = true,
    showDontAskAgain = false,
    onDontAskAgainChange,
    isLoading = false
}: AlertModalProps) {
    const { t } = useTranslation('common');
    const [mounted, setMounted] = useState(false);
    const [dontAskAgain, setDontAskAgain] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Lock body scroll when modal is open
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const handleConfirm = () => {
        if (showDontAskAgain && onDontAskAgainChange) {
            onDontAskAgainChange(dontAskAgain);
        }
        onConfirm();
    };

    const defaultTitle = title || t('alerts.warning');
    const defaultConfirmText = confirmText || t('alerts.ok');
    const defaultCancelText = cancelText || t('alerts.cancel');

    return createPortal(
        <div className={styles.overlay} onClick={showCancel ? onClose : undefined}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.content}>
                    <span className={styles.icon}>{iconMap[type]}</span>
                    <h2 className={styles.title}>{defaultTitle}</h2>
                    <p className={styles.message}>{message}</p>

                    {showDontAskAgain && (
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={dontAskAgain}
                                onChange={(e) => setDontAskAgain(e.target.checked)}
                            />
                            <span>{t('alerts.dontAskAgain')}</span>
                        </label>
                    )}

                    <div className={styles.actions}>
                        {showCancel && (
                            <button
                                className={`${styles.btn} ${styles.cancelBtn}`}
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                {defaultCancelText}
                            </button>
                        )}
                        <button
                            className={`${styles.btn} ${styles.confirmBtn} ${styles[type]}`}
                            onClick={handleConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? t('alerts.loading') : defaultConfirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
