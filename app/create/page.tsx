'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookSettings,
    BookType,
    BookTheme,
    BookTypeInfo,
    BookThemeInfo,
    getAgeGroup,
} from '@/lib/types';
import { saveBook } from '@/lib/storage';
import { ART_STYLES, ArtStyle, ImageQuality } from '@/lib/art-styles';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { AlertModal } from '@/components/AlertModal';
import styles from './page.module.css';

type WizardStep = 'child' | 'type' | 'format' | 'theme' | 'style' | 'title';

export default function CreateBookPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const { t, i18n } = useTranslation('create');
    const [currentStep, setCurrentStep] = useState<WizardStep>('child');
    const [settings, setSettings] = useState<Partial<BookSettings> & { storyDescription?: string; artStyle?: ArtStyle }>({
        childName: '',
        childAge: 3,
        bookType: undefined,
        printFormat: undefined,
        bookTheme: undefined,
        title: '',
        storyDescription: '',
        artStyle: 'storybook_classic'
    });
    const [isCreating, setIsCreating] = useState(false);
    const [creatingStatus, setCreatingStatus] = useState('');
    const [childPhoto, setChildPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingCreate, setPendingCreate] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
    const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
    const previousLanguageRef = useRef<string>(i18n.language);

    // Track unsaved changes
    useEffect(() => {
        const hasChanges = !!(settings.childName || settings.childAge !== 3 || settings.bookType || settings.bookTheme || settings.storyDescription || childPhoto);
        setHasUnsavedChanges(hasChanges);
    }, [settings, childPhoto]);

    // Detect language changes and show warning if there are unsaved changes
    useEffect(() => {
        const handleLanguageChange = (lng: string) => {
            // Prevent infinite loop - only act if language actually changed
            if (lng === previousLanguageRef.current) {
                return;
            }

            if (hasUnsavedChanges && !isCreating) {
                // Language is about to change, show warning
                setPendingLanguage(lng);
                setShowUnsavedChangesModal(true);
                // Revert to previous language temporarily
                i18n.changeLanguage(previousLanguageRef.current);
            } else {
                // No unsaved changes, allow language change
                previousLanguageRef.current = lng;
            }
        };

        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [hasUnsavedChanges, isCreating, i18n]);

    // Cleanup object URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (photoPreview && photoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    const steps: WizardStep[] = ['child', 'type', 'format', 'theme', 'style', 'title'];
    const currentStepIndex = steps.indexOf(currentStep);

    // Warn before leaving if there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleBack = () => {
        if (currentStepIndex === 0) {
            // On first step, check for unsaved changes before going back
            if (hasUnsavedChanges) {
                const confirmLeave = window.confirm(
                    'You have unsaved changes. Are you sure you want to leave? Your progress will be lost.'
                );
                if (!confirmLeave) return;
            }
            router.push('/');
        } else {
            setCurrentStep(steps[currentStepIndex - 1]);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 'child':
                return settings.childName && settings.childName.trim().length > 0;
            case 'type':
                return settings.bookType !== undefined;
            case 'format':
                return settings.printFormat !== undefined;
            case 'theme':
                return settings.bookTheme !== undefined;
            case 'style':
                return settings.artStyle !== undefined;
            case 'title':
                return true; // Title is optional
            default:
                return false;
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setChildPhoto(file);
            // Use createObjectURL for better performance and reliability
            const objectUrl = URL.createObjectURL(file);
            setPhotoPreview(objectUrl);
        }
    };

    const handleNext = () => {
        if (!canProceed()) return;

        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex]);
        } else {
            // Check if user is authenticated before generating
            if (!user && !isAuthLoading) {
                setPendingCreate(true);
                setShowAuthModal(true);
            } else {
                handleCreate();
            }
        }
    };

    // Handle auth modal close - if user just authenticated and we have a pending create, proceed
    useEffect(() => {
        if (pendingCreate && user && !showAuthModal) {
            setPendingCreate(false);
            handleCreate();
        }
    }, [user, pendingCreate, showAuthModal]);

    const handleCreate = async () => {
        const startTime = Date.now();
        console.log('[CLIENT] ========================================');
        console.log('[CLIENT] === BOOK CREATION STARTED ===');
        console.log('[CLIENT] ========================================');
        console.log('[CLIENT] Settings:', settings);

        setIsCreating(true);

        try {
            // Step 1: Extract character from photo if provided
            let characterDescription = '';
            if (childPhoto) {
                console.log('[CLIENT] Step 1: Extracting character from photo...');
                const extractStart = Date.now();
                setCreatingStatus(t('status.extractingCharacter'));
                const formData = new FormData();
                formData.append('photo', childPhoto);

                const extractRes = await fetch('/api/ai/extract-character', {
                    method: 'POST',
                    body: formData,
                });
                console.log(`[CLIENT] Photo extraction response status: ${extractRes.status} in ${Date.now() - extractStart}ms`);

                if (extractRes.ok) {
                    const extractData = await extractRes.json();
                    characterDescription = extractData.characterDescription;
                    console.log('[CLIENT] Character description:', characterDescription?.slice(0, 100));
                } else {
                    console.log('[CLIENT] Photo extraction failed:', await extractRes.text());
                }
            } else {
                console.log('[CLIENT] Step 1: No photo provided, skipping extraction');
            }

            // Step 2: Generate the complete book with AI
            console.log('[CLIENT] Step 2: Generating complete book...');
            const genStart = Date.now();
            setCreatingStatus(t('status.generatingStory'));

            // Convert photo to base64 if present for the generation API
            let base64Photo: string | undefined;
            if (childPhoto) {
                base64Photo = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(childPhoto);
                });
            }

            const requestBody = {
                childName: settings.childName || 'My Child',
                childAge: settings.childAge || 3,
                bookTheme: settings.bookTheme || 'adventure',
                bookType: settings.bookType || 'picture',
                printFormat: settings.printFormat || 'portrait',
                pageCount: (settings.printFormat === 'square' || settings.bookType === 'story') ? 12 : 10, // 12 Story Beats = 24 Physical Pages (Image + Text)
                characterDescription,
                storyDescription: settings.storyDescription,
                artStyle: settings.artStyle || 'storybook_classic',
                imageQuality: settings.imageQuality || 'fast',
                childPhoto: base64Photo,
                language: i18n.language || 'en',
            };
            console.log('[CLIENT] Request body:', requestBody);

            const response = await fetch('/api/ai/generate-book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            console.log(`[CLIENT] API response status: ${response.status} in ${Date.now() - genStart}ms`);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('[CLIENT] API error response:', errorText);
                throw new Error('Failed to generate book');
            }

            const data = await response.json();
            console.log('[CLIENT] API response data:', data);

            console.log('[CLIENT] Step 3: Navigating to book viewer...');
            setCreatingStatus(t('status.openingBook'));
            await new Promise(resolve => setTimeout(resolve, 500));

            const totalDuration = Date.now() - startTime;
            console.log('[CLIENT] ========================================');
            console.log(`[CLIENT] === BOOK CREATION COMPLETE in ${totalDuration}ms ===`);
            console.log('[CLIENT] ========================================');

            router.push(`/book/${data.bookId}`);
        } catch (error) {
            const totalDuration = Date.now() - startTime;
            console.log('[CLIENT] ========================================');
            console.log(`[CLIENT] === BOOK CREATION FAILED after ${totalDuration}ms ===`);
            console.log('[CLIENT] ========================================');
            console.error('[CLIENT] Error:', error);
            setCreatingStatus('');
            setIsCreating(false);
            alert(t('errors.creationFailed'));
        }
    };

    const updateSettings = <K extends keyof BookSettings>(key: K, value: BookSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                {/* Background */}
                <div className={styles.background}>
                    <div className={styles.bgShape1}></div>
                    <div className={styles.bgShape2}></div>
                </div>
            {/* Progress bar */}
            <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                    ></div>
                </div>
                <div className={styles.stepIndicators}>
                    {steps.map((step, index) => (
                        <div
                            key={step}
                            className={`${styles.stepDot} ${index <= currentStepIndex ? styles.active : ''}`}
                        >
                            {index < currentStepIndex ? '✓' : index + 1}
                        </div>
                    ))}
                </div>
                <button className={styles.backButton} onClick={handleBack}>
                    {t('wizard.back')}
                </button>
            </div>

            {/* Wizard Content */}
            <div className={styles.wizardContainer}>
                <AnimatePresence mode="wait">
                    {currentStep === 'child' && (
                        <motion.div
                            key="child"
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className={styles.stepIcon}>👶</div>
                            <h1 className={styles.stepTitle}>{t('steps.child.title')}</h1>
                            <p className={styles.stepSubtitle}>
                                {t('steps.child.subtitle')}
                            </p>

                            <div className={styles.formFields}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('steps.child.nameLabel')}</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder={t('steps.child.namePlaceholder')}
                                        value={settings.childName || ''}
                                        onChange={(e) => updateSettings('childName', e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        {t('steps.child.ageLabel')} <span className={styles.ageValue}>{settings.childAge} {t('steps.child.ageYears')}</span>
                                    </label>
                                    <div className={styles.sliderContainer}>
                                        <input
                                            type="range"
                                            className={styles.slider}
                                            min="0"
                                            max="12"
                                            value={settings.childAge || 3}
                                            onChange={(e) => updateSettings('childAge', parseInt(e.target.value))}
                                        />
                                        <div className={styles.sliderLabels}>
                                            <span>0</span>
                                            <span>3</span>
                                            <span>6</span>
                                            <span>9</span>
                                            <span>12</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Photo upload for AI character */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        {t('steps.child.photoLabel')}
                                    </label>
                                    <p className={styles.inputHint} style={{ marginBottom: '0.5rem' }}>
                                        {t('steps.child.photoHint')}
                                    </p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.secondaryButton}
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                    >
                                        {childPhoto ? t('steps.child.photoChange') : t('steps.child.photoButton')}
                                    </button>
                                    {photoPreview && (
                                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                            <img
                                                src={photoPreview}
                                                alt="Child preview"
                                                style={{
                                                    width: '120px',
                                                    height: '120px',
                                                    objectFit: 'cover',
                                                    borderRadius: '50%',
                                                    border: '4px solid var(--color-primary)'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'type' && (
                        <motion.div
                            key="type"
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className={styles.stepIcon}>📚</div>
                            <h1 className={styles.stepTitle}>{t('steps.type.title')}</h1>
                            <p className={styles.stepSubtitle}>
                                {settings.childName ? t('steps.type.subtitle', { childName: settings.childName }) : t('steps.type.subtitleDefault')}
                            </p>

                            <div className={styles.optionsGrid}>
                                {(Object.keys(BookTypeInfo) as BookType[]).map((type) => {
                                    const info = BookTypeInfo[type];
                                    return (
                                        <button
                                            key={type}
                                            className={`${styles.optionCard} ${settings.bookType === type ? styles.selected : ''}`}
                                            onClick={() => updateSettings('bookType', type)}
                                            style={{ '--option-color': info.color } as React.CSSProperties}
                                        >
                                            <span className={styles.optionEmoji}>{info.icon}</span>
                                            <h3 className={styles.optionTitle}>{t(`bookTypes.${type}.label`)}</h3>
                                            <p className={styles.optionDesc}>{t(`bookTypes.${type}.description`)}</p>
                                            <span className={styles.optionAge}>{t(`bookTypes.${type}.ageRange`)}</span>
                                            {settings.bookType === type && (
                                                <span className={styles.checkmark}>✓</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'format' && (
                        <motion.div
                            key="format"
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className={styles.stepIcon}>📏</div>
                            <h1 className={styles.stepTitle}>{t('steps.format.title')}</h1>
                            <p className={styles.stepSubtitle}>
                                {t('steps.format.subtitle')}
                            </p>

                            <div className={styles.optionsGrid}>
                                <button
                                    className={`${styles.optionCard} ${settings.printFormat === 'square' ? styles.selected : ''}`}
                                    onClick={() => updateSettings('printFormat', 'square')}
                                    style={{ '--option-color': '#ec4899' } as React.CSSProperties}
                                >
                                    <span className={styles.optionEmoji}>✨</span>
                                    <h3 className={styles.optionTitle}>{t('formats.square.label')}</h3>
                                    <p className={styles.optionDesc}>{t('formats.square.description')}</p>
                                    <span className={styles.optionAge}>{t('formats.square.pages')}</span>
                                    {settings.printFormat === 'square' && (
                                        <span className={styles.checkmark}>✓</span>
                                    )}
                                </button>

                                <button
                                    className={`${styles.optionCard} ${settings.printFormat === 'portrait' ? styles.selected : ''}`}
                                    onClick={() => updateSettings('printFormat', 'portrait')}
                                    style={{ '--option-color': '#3b82f6' } as React.CSSProperties}
                                >
                                    <span className={styles.optionEmoji}>📱</span>
                                    <h3 className={styles.optionTitle}>{t('formats.portrait.label')}</h3>
                                    <p className={styles.optionDesc}>{t('formats.portrait.description')}</p>
                                    <span className={styles.optionAge}>{t('formats.portrait.pages')}</span>
                                    {settings.printFormat === 'portrait' && (
                                        <span className={styles.checkmark}>✓</span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'theme' && (
                        <motion.div
                            key="theme"
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className={styles.stepIcon}>🎨</div>
                            <h1 className={styles.stepTitle}>{t('steps.theme.title')}</h1>
                            <p className={styles.stepSubtitle}>
                                {t('steps.theme.subtitle')}
                            </p>

                            <div className={styles.themeGrid}>
                                {(Object.keys(BookThemeInfo) as BookTheme[]).map((theme) => {
                                    const info = BookThemeInfo[theme];
                                    return (
                                        <button
                                            key={theme}
                                            className={`${styles.themeCard} ${settings.bookTheme === theme ? styles.selected : ''}`}
                                            onClick={() => updateSettings('bookTheme', theme)}
                                            style={{
                                                '--theme-color-1': info.colors[0],
                                                '--theme-color-2': info.colors[1]
                                            } as React.CSSProperties}
                                        >
                                            <span className={styles.themeEmoji}>{info.icon}</span>
                                            <span className={styles.themeName}>{t(`themes.${theme}`)}</span>
                                            {settings.bookTheme === theme && (
                                                <span className={styles.checkmark}>✓</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className={styles.formFields} style={{ marginTop: '2rem' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        {t('steps.theme.storyLabel')}
                                    </label>
                                    <textarea
                                        className={styles.formInput}
                                        placeholder={t('steps.theme.storyPlaceholder')}
                                        value={settings.storyDescription || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, storyDescription: e.target.value }))}
                                        rows={3}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'style' && (
                        <motion.div
                            key="style"
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className={styles.stepIcon}>🎨</div>
                            <h1 className={styles.stepTitle}>{t('steps.style.title')}</h1>
                            <p className={styles.stepSubtitle}>
                                {t('steps.style.subtitle')}
                            </p>

                            <div className={styles.themeGrid}>
                                {(Object.keys(ART_STYLES) as ArtStyle[]).map((style) => {
                                    const info = ART_STYLES[style];
                                    const emojis: Record<string, string> = {
                                        storybook_classic: '📚',
                                        watercolor: '🖼️',
                                        digital_art: '💻',
                                        cartoon: '🎬',
                                        pixel_art: '👾',
                                        coloring_book: '✏️'
                                    };
                                    return (
                                        <button
                                            key={style}
                                            className={`${styles.themeCard} ${settings.artStyle === style ? styles.selected : ''}`}
                                            onClick={() => setSettings(prev => ({ ...prev, artStyle: style }))}
                                            style={{
                                                '--theme-color-1': style === 'storybook_classic' ? '#8b5cf6' :
                                                    style === 'watercolor' ? '#06b6d4' :
                                                        style === 'digital_art' ? '#3b82f6' :
                                                            style === 'cartoon' ? '#f59e0b' :
                                                                style === 'pixel_art' ? '#10b981' : '#6b7280',
                                                '--theme-color-2': style === 'storybook_classic' ? '#ec4899' :
                                                    style === 'watercolor' ? '#a855f7' :
                                                        style === 'digital_art' ? '#8b5cf6' :
                                                            style === 'cartoon' ? '#ef4444' :
                                                                style === 'pixel_art' ? '#22d3ee' : '#9ca3af'
                                            } as React.CSSProperties}
                                        >
                                            <span className={styles.themeEmoji}>{emojis[style]}</span>
                                            <span className={styles.themeName}>{t(`artStyles.${style}`)}</span>
                                            {settings.artStyle === style && (
                                                <span className={styles.checkmark}>✓</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className={styles.qualitySection} style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <label className={styles.fieldLabel} style={{ display: 'block', marginBottom: '1rem', fontWeight: 600, color: '#1e293b' }}>
                                    {t('imageQuality.label')}
                                </label>
                                <div className={styles.qualityToggle} style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => setSettings(prev => ({ ...prev, imageQuality: 'fast' }))}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: settings.imageQuality === 'fast' || !settings.imageQuality ? '2px solid #6366f1' : '1px solid #cbd5e1',
                                            background: settings.imageQuality === 'fast' || !settings.imageQuality ? '#e0e7ff' : 'white',
                                            color: settings.imageQuality === 'fast' || !settings.imageQuality ? '#4338ca' : '#64748b',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {t('imageQuality.fast')}
                                    </button>
                                    <button
                                        onClick={() => setSettings(prev => ({ ...prev, imageQuality: 'pro' }))}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: settings.imageQuality === 'pro' ? '2px solid #ec4899' : '1px solid #cbd5e1',
                                            background: settings.imageQuality === 'pro' ? '#fce7f3' : 'white',
                                            color: settings.imageQuality === 'pro' ? '#be185d' : '#64748b',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {t('imageQuality.pro')}
                                    </button>
                                </div>
                                <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                                    {settings.imageQuality === 'pro'
                                        ? t('imageQuality.proDescription')
                                        : t('imageQuality.fastDescription')}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'title' && (
                        <motion.div
                            key="title"
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className={styles.stepIcon}>✨</div>
                            <h1 className={styles.stepTitle}>{t('steps.title.title')}</h1>
                            <p className={styles.stepSubtitle}>
                                {t('steps.title.subtitle')}
                            </p>

                            <div className={styles.formFields}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('steps.title.titleLabel')}</label>
                                    <input
                                        type="text"
                                        className={`${styles.formInput} ${styles.titleInput}`}
                                        placeholder={settings.childName ? t('steps.title.titlePlaceholder', { childName: settings.childName }) : t('steps.title.titlePlaceholderDefault')}
                                        value={settings.title || ''}
                                        onChange={(e) => updateSettings('title', e.target.value)}
                                        autoFocus
                                    />
                                    <p className={styles.inputHint}>
                                        {t('errors.emptyTitleHint')}
                                    </p>
                                </div>

                                {/* Preview card */}
                                <div className={styles.previewCard}>
                                    <div
                                        className={styles.previewCover}
                                        style={{
                                            background: `linear-gradient(135deg, ${settings.bookTheme ? BookThemeInfo[settings.bookTheme].colors[0] : '#6366f1'
                                                } 0%, ${settings.bookTheme ? BookThemeInfo[settings.bookTheme].colors[1] : '#ec4899'
                                                } 100%)`
                                        }}
                                    >
                                        <span className={styles.previewEmoji}>
                                            {settings.bookType ? BookTypeInfo[settings.bookType].icon : '📚'}
                                        </span>
                                        <span className={styles.previewTitle}>
                                            {settings.title || (settings.childName ? t('preview.defaultTitle', { childName: settings.childName }) : t('steps.title.titlePlaceholderDefault'))}
                                        </span>
                                    </div>
                                    <div className={styles.previewInfo}>
                                        <p>{t('preview.forChild', { childName: settings.childName, age: settings.childAge })}</p>
                                        <p>{settings.bookType && t(`bookTypes.${settings.bookType}.label`)}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
                <button
                    className={styles.secondaryButton}
                    onClick={handleBack}
                >
                    {t('buttons.back')}
                </button>

                <button
                    className={`${styles.primaryButton} ${!canProceed() ? styles.disabled : ''}`}
                    onClick={handleNext}
                    disabled={!canProceed() || isCreating}
                >
                    {isCreating ? (
                        <>
                            <span className={styles.spinner}></span>
                            {creatingStatus || t('status.generatingStory')}
                        </>
                    ) : currentStepIndex === steps.length - 1 ? (
                        t('buttons.generateBook')
                    ) : (
                        t('buttons.continue')
                    )}
                </button>
            </div>

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            {/* Unsaved Changes Alert */}
            <AlertModal
                isOpen={showUnsavedChangesModal}
                onClose={() => {
                    setShowUnsavedChangesModal(false);
                    setPendingLanguage(null);
                }}
                onConfirm={() => {
                    // User confirmed - proceed with language change
                    if (pendingLanguage) {
                        previousLanguageRef.current = pendingLanguage;
                        i18n.changeLanguage(pendingLanguage);
                    }
                    setShowUnsavedChangesModal(false);
                    setPendingLanguage(null);
                    // Clear the form
                    setSettings({
                        childName: '',
                        childAge: 3,
                        bookType: undefined,
                        printFormat: undefined,
                        bookTheme: undefined,
                        title: '',
                        storyDescription: '',
                        artStyle: 'storybook_classic'
                    });
                    setChildPhoto(null);
                    setPhotoPreview('');
                    setCurrentStep('child');
                }}
                type="warning"
                title={t('alerts.unsavedChanges.title', { ns: 'common' })}
                message={t('alerts.unsavedChanges.message', { ns: 'common' })}
                confirmText={t('alerts.ok', { ns: 'common' })}
                cancelText={t('alerts.cancel', { ns: 'common' })}
            />
        </main>
        </>
    );
}
