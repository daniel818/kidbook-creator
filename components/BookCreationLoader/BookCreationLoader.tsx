'use client';

import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styles from './BookCreationLoader.module.css';

export type CreationPhase = 'extracting' | 'writing' | 'opening' | '';

interface BookCreationLoaderProps {
    isActive: boolean;
    childName: string;
    hasPhoto: boolean;
    phase: CreationPhase;
}

// Internal display phase (timer-driven within the 'writing' phase)
type DisplayPhase = 'gathering' | 'writing' | 'painting' | 'opening';

export function BookCreationLoader({ isActive, childName, hasPhoto, phase }: BookCreationLoaderProps) {
    const { t } = useTranslation('create');
    const [mounted, setMounted] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [displayPhase, setDisplayPhase] = useState<DisplayPhase>('gathering');
    const [progressPercent, setProgressPercent] = useState(0);

    // SSR-safe mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    // Body scroll lock
    useEffect(() => {
        if (isActive) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isActive]);

    // Map external phase to internal display phase with timers
    useEffect(() => {
        if (!isActive) {
            setDisplayPhase('gathering');
            setProgressPercent(0);
            setIsExiting(false);
            return;
        }

        if (phase === 'opening') {
            setDisplayPhase('opening');
            setProgressPercent(100);
            setIsExiting(true);
            return;
        }

        if (phase === 'extracting') {
            setDisplayPhase('gathering');
            setProgressPercent(5);
            return;
        }

        // During the 'writing' phase, run timer-based sub-phases
        if (phase === 'writing') {
            setDisplayPhase('gathering');
            setProgressPercent(15);

            const timer1 = setTimeout(() => {
                setDisplayPhase('writing');
                setProgressPercent(30);
            }, 1200);

            const timer2 = setTimeout(() => {
                setDisplayPhase('painting');
                setProgressPercent(55);
            }, 6000);

            // Slowly progress toward 95%
            const progressInterval = setInterval(() => {
                setProgressPercent(prev => {
                    if (prev >= 92) return 92;
                    return prev + 0.5;
                });
            }, 500);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearInterval(progressInterval);
            };
        }
    }, [isActive, phase]);

    // Generate sparkle positions (stable across renders)
    const sparkles = useMemo(() => {
        return Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 5,
            size: 2 + Math.random() * 4,
            duration: 3 + Math.random() * 4,
        }));
    }, []);

    if (!mounted || !isActive) return null;

    const heroName = childName || 'Your Child';

    const statusText = (() => {
        switch (displayPhase) {
            case 'gathering':
                return t('status.gatheringMagic', 'Gathering the magic...');
            case 'writing':
                return t('status.writingStory', 'Writing your story...');
            case 'painting':
                return t('status.paintingCover', 'Painting the cover...');
            case 'opening':
                return t('status.openingBook', 'Opening your book...');
        }
    })();

    const heroText = t('status.creatingAdventure', "Creating {{childName}}'s Adventure...", { childName: heroName });

    return createPortal(
        <div
            className={`${styles.overlay} ${isExiting ? styles.overlayExiting : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={heroText}
        >
            {/* Background glow */}
            <div className={styles.backgroundGlow} aria-hidden="true" />

            {/* Shimmer sweep */}
            <div className={styles.shimmer} aria-hidden="true" />

            {/* Sparkle particles */}
            {sparkles.map((s) => (
                <div
                    key={s.id}
                    className={styles.sparkle}
                    aria-hidden="true"
                    style={{
                        '--x': `${s.x}%`,
                        '--y': `${s.y}%`,
                        '--delay': `${s.delay}s`,
                        '--size': `${s.size}px`,
                        '--duration': `${s.duration}s`,
                    } as React.CSSProperties}
                />
            ))}

            {/* Central content */}
            <div className={styles.centerContent}>
                {/* Pulsing orb */}
                <div className={styles.centralOrb}>
                    <span className={`material-symbols-outlined ${styles.orbIcon}`} aria-hidden="true">
                        auto_stories
                    </span>
                </div>

                {/* Hero text */}
                <h1 className={styles.heroText}>{heroText}</h1>

                {/* Status text (keyed by phase for fade-in animation) */}
                <div key={displayPhase} className={styles.statusText} aria-live="polite">
                    {statusText}
                    <span className={styles.progressDots}>
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                    </span>
                </div>
            </div>

            {/* Progress bar at bottom */}
            <div className={styles.progressLine}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>,
        document.body
    );
}
