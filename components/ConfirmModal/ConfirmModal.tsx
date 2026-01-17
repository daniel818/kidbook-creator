import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    isLoading = false
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

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

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.content}>
                    <span className={styles.icon}>🗑️</span>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.message}>{message}</p>

                    <div className={styles.actions}>
                        <button
                            className={`${styles.btn} ${styles.cancelBtn}`}
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </button>
                        <button
                            className={`${styles.btn} ${styles.confirmBtn}`}
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Deleting...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
