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
} from '@/lib/types';
import { ART_STYLES, ArtStyle } from '@/lib/art-styles';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { AlertModal } from '@/components/AlertModal';
import { BookCreationLoader, CreationPhase } from '@/components/BookCreationLoader';
import styles from './page.module.css';

type WizardStep = 'child' | 'format' | 'theme' | 'preview';

export default function CreateBookPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
    const { t, i18n } = useTranslation('create');
    const [currentStep, setCurrentStep] = useState<WizardStep>('child');
    const [settings, setSettings] = useState<Partial<BookSettings> & { storyDescription?: string; artStyle?: ArtStyle }>({
        childName: '',
        childAge: 3,
        childGender: undefined,
        bookType: undefined,
        printFormat: undefined,
        bookTheme: undefined,
        title: '',
        storyDescription: '',
        artStyle: 'storybook_classic'
    });
    const [isCreating, setIsCreating] = useState(false);
    const [creatingStatus, setCreatingStatus] = useState('');
    const [creatingPhase, setCreatingPhase] = useState<CreationPhase>('');
    const [childPhoto, setChildPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingCreate, setPendingCreate] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
    const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
    const previousLanguageRef = useRef<string>(i18n.language);
    const [stitchHeroImgOk, setStitchHeroImgOk] = useState(true);
    const [showAdvancedStyle, setShowAdvancedStyle] = useState(false);

    // Track unsaved changes
    useEffect(() => {
        const hasChanges = !!(
            settings.childName ||
            settings.childAge !== 3 ||
            settings.childGender ||
            settings.bookTheme ||
            settings.storyDescription ||
            childPhoto
        );
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

    const steps: WizardStep[] = ['child', 'theme', 'format', 'preview'];
    const currentStepIndex = steps.indexOf(currentStep);
    const effectiveBookType = (settings.bookType || 'story') as BookType;

    useEffect(() => {
        if (settings.printFormat) return;
        setSettings(prev => {
            if (prev.printFormat) return prev;
            const preferredFormat = (prev.childAge || 3) <= 5 ? 'square' : 'portrait';
            return { ...prev, printFormat: preferredFormat };
        });
    }, [settings.childAge, settings.printFormat]);

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
            case 'format':
                return settings.printFormat !== undefined;
            case 'theme':
                return settings.bookTheme !== undefined;
            case 'preview':
                return true; // Title is optional
            default:
                return false;
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('[PHOTO] File input changed', e.target.files);
        const file = e.target.files?.[0];
        if (file) {
            console.log('[PHOTO] File selected:', file.name, file.size, file.type);
            setChildPhoto(file);
            // Use createObjectURL for better performance and reliability
            const objectUrl = URL.createObjectURL(file);
            console.log('[PHOTO] Object URL created:', objectUrl);
            setPhotoPreview(objectUrl);
        } else {
            console.log('[PHOTO] No file selected');
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
        setCreatingPhase('extracting');

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

            // Step 2: Generate story + cover illustration (remaining illustrations generate in background)
            console.log('[CLIENT] Step 2: Generating story and cover...');
            const genStart = Date.now();
            setCreatingPhase('writing');
            setCreatingStatus(t('status.writingStory', 'Writing your story...'));

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
                childGender: settings.childGender,
                bookTheme: settings.bookTheme || 'adventure',
                bookType: effectiveBookType,
                printFormat: settings.printFormat || 'portrait',
                pageCount: (settings.printFormat === 'square' || effectiveBookType === 'story') ? 12 : 10, // 12 Story Beats = 24 Physical Pages (Image + Text)
                characterDescription,
                storyDescription: settings.storyDescription,
                artStyle: settings.artStyle || 'storybook_classic',
                imageQuality: settings.imageQuality || 'fast',
                childPhoto: base64Photo,
                language: i18n.language || 'en',
                preview: true,
                previewPageCount: 3,
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
            setCreatingPhase('opening');
            setCreatingStatus(t('status.openingBook'));
            await new Promise(resolve => setTimeout(resolve, 1200));

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
            setCreatingPhase('');
            setIsCreating(false);
            alert(t('errors.creationFailed'));
        }
    };

    const updateSettings = <K extends keyof BookSettings>(key: K, value: BookSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const stripNavArrows = (value: string) => {
        return value
            .replace(/^\s*[←‹«]\s*/u, '')
            .replace(/\s*[→›»]\s*$/u, '')
            .trim();
    };

    const hexToRgba = (hex: string, alpha: number) => {
        const normalized = hex.replace('#', '').trim();
        const full = normalized.length === 3
            ? normalized.split('').map(ch => ch + ch).join('')
            : normalized;
        if (full.length !== 6) return `rgba(0,0,0,${alpha})`;
        const r = parseInt(full.slice(0, 2), 16);
        const g = parseInt(full.slice(2, 4), 16);
        const b = parseInt(full.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const backButtonLabel = stripNavArrows(t('buttons.back'));
    const continueButtonLabel = stripNavArrows(t('buttons.continue'));
    const progressWidth = `${Math.round(((currentStepIndex + 1) / steps.length) * 100)}%`;
    const themeDetails = (settings.storyDescription || '').slice(0, 500);
    const themeDetailsCount = themeDetails.length;
    const artStyleDescriptor: Record<ArtStyle, string> = {
        storybook_classic: t('steps.style.descriptors.storybook', 'Classic & Detailed'),
        watercolor: t('steps.style.descriptors.watercolor', 'Dreamy & Soft'),
        digital_art: t('steps.style.descriptors.digital', 'Modern & Vibrant'),
        cartoon: t('steps.style.descriptors.cartoon', 'Fun & Expressive'),
        pixel_art: t('steps.style.descriptors.pixel', 'Retro & Playful'),
        coloring_book: t('steps.style.descriptors.coloring', 'Minimal & Creative'),
    };

    const artStylePreviewSrc = (style: ArtStyle) => {
        const prefix = style === 'storybook_classic' ? 'storybook' : style.replace(/_/g, '');
        return `/images/${prefix}-design.png`;
    };
    const artStyleLabel = (style: ArtStyle | undefined) => (style ? t(`artStyles.${style}`) : '');

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
                    <div
                        className={styles.stitchProgressLine}
                        role="progressbar"
                        aria-label={t('wizard.stepper.aria', 'Progress')}
                        aria-valuemin={1}
                        aria-valuemax={steps.length}
                        aria-valuenow={currentStepIndex + 1}
                    >
                        <div className={styles.stitchProgressLineFill} style={{ width: progressWidth }}></div>
                    </div>
                </div>

                {/* Wizard Content */}
                <div className={`${styles.wizardContainer} ${currentStep === 'child' ? styles.stitchWizardContainer : ''}`}>
                    <AnimatePresence mode="wait">
                        {currentStep === 'child' && (
                            <motion.div
                                key="child"
                                className={`${styles.stepContent} ${styles.stitchStepContent}`}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className={styles.stitchChildCard}>
                                    <div className={styles.stitchHeroRow}>
                                        <div className={styles.stitchHeroBubble}>
                                            {t('steps.child.heroPrompt', "Let's create your magical hero!")}
                                        </div>
                                    </div>
                                    <div className={`${styles.stitchHeroVisual} ${styles.stitchHeroVisualUnder}`} aria-hidden="true">
                                        <div className={styles.stitchHeroImageWrap}>
                                            {stitchHeroImgOk ? (
                                                <img
                                                    className={styles.stitchHeroImage}
                                                    src="/images/dragon-hero.png"
                                                    alt={t('steps.child.heroImageAlt', 'Dragon hero')}
                                                    onError={() => setStitchHeroImgOk(false)}
                                                />
                                            ) : (
                                                <div className={styles.stitchHeroAvatar}>🐉</div>
                                            )}
                                        </div>
                                        <div className={styles.stitchHeroCloud}></div>
                                    </div>

                                    <section className={`${styles.stitchSection} ${styles.stitchSectionName}`}>
                                        <label className={styles.stitchSectionLabel} htmlFor="stitch-child-name">
                                            {t('steps.child.nameQuestion', "WHAT'S THEIR NAME?")}
                                        </label>
                                        <input
                                            id="stitch-child-name"
                                            type="text"
                                            className={styles.stitchTextInput}
                                            placeholder={t('steps.child.namePlaceholder')}
                                            value={settings.childName || ''}
                                            onChange={(e) => updateSettings('childName', e.target.value)}
                                            autoFocus
                                        />
                                    </section>

                                    <section className={`${styles.stitchSection} ${styles.stitchSectionGender}`}>
                                        <div className={styles.stitchSectionLabel}>
                                            {t('steps.child.genderQuestion', 'CHOOSE GENDER')}
                                        </div>
                                        <div
                                            className={styles.stitchGenderGrid}
                                            role="radiogroup"
                                            aria-label={t('steps.child.genderQuestion', 'Choose gender')}
                                        >
                                            <button
                                                type="button"
                                                className={`${styles.stitchGenderOption} ${settings.childGender === 'boy' ? styles.stitchGenderOptionSelected : ''}`}
                                                onClick={() => updateSettings('childGender', 'boy')}
                                                role="radio"
                                                aria-checked={settings.childGender === 'boy'}
                                            >
                                                <span className={styles.stitchGenderEmoji} aria-hidden="true">👦</span>
                                                <span className={styles.stitchGenderText}>{t('steps.child.genderBoy', 'Boy')}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.stitchGenderOption} ${settings.childGender === 'girl' ? styles.stitchGenderOptionSelected : ''}`}
                                                onClick={() => updateSettings('childGender', 'girl')}
                                                role="radio"
                                                aria-checked={settings.childGender === 'girl'}
                                            >
                                                <span className={styles.stitchGenderEmoji} aria-hidden="true">👧</span>
                                                <span className={styles.stitchGenderText}>{t('steps.child.genderGirl', 'Girl')}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.stitchGenderOption} ${settings.childGender === 'other' ? styles.stitchGenderOptionSelected : ''}`}
                                                onClick={() => updateSettings('childGender', 'other')}
                                                role="radio"
                                                aria-checked={settings.childGender === 'other'}
                                            >
                                                <span className={styles.stitchGenderEmoji} aria-hidden="true">✨</span>
                                                <span className={styles.stitchGenderText}>{t('steps.child.genderOther', 'Other')}</span>
                                            </button>
                                        </div>
                                    </section>

                                    <section className={`${styles.stitchSection} ${styles.stitchSectionAge}`}>
                                        <div className={styles.stitchAgeHeader}>
                                            <label className={styles.stitchSectionLabel} htmlFor="stitch-child-age">
                                                {t('steps.child.ageQuestion', 'HOW OLD?')}
                                            </label>
                                            <span className={styles.stitchAgePill}>
                                                {settings.childAge} {t('steps.child.agePill', 'Years Old')}
                                            </span>
                                        </div>
                                        <input
                                            id="stitch-child-age"
                                            type="range"
                                            className={styles.stitchAgeSlider}
                                            min="1"
                                            max="12"
                                            value={settings.childAge || 3}
                                            onChange={(e) => updateSettings('childAge', parseInt(e.target.value))}
                                        />
                                        <div className={styles.stitchAgeRange} aria-hidden="true">
                                            <span>1</span>
                                            <span>12+</span>
                                        </div>
                                    </section>

                                    <section className={`${styles.stitchSection} ${styles.stitchSectionPhoto}`}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/png, image/jpeg"
                                            onChange={handlePhotoChange}
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            type="button"
                                            className={styles.stitchUploadRow}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <span className={styles.stitchUploadIcon} aria-hidden="true">
                                                <span className="material-symbols-outlined">add_a_photo</span>
                                            </span>
                                            <span className={styles.stitchUploadBody}>
                                                <span className={styles.stitchUploadTitle}>
                                                    {t('steps.child.photoCta', 'Add Hero Photo')}
                                                </span>
                                                <span className={styles.stitchUploadMeta}>
                                                    {t('steps.child.photoMeta', 'OPTIONAL • JPG/PNG')}
                                                </span>
                                            </span>
                                            {photoPreview ? (
                                                <img
                                                    className={styles.stitchUploadPreview}
                                                    src={photoPreview}
                                                    alt={t('steps.child.photoPreviewAlt', 'Uploaded hero photo preview')}
                                                />
                                            ) : (
                                                <span className={styles.stitchUploadChevron} aria-hidden="true">→</span>
                                            )}
                                        </button>
                                    </section>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 'format' && (
                            <motion.div
                                key="format"
                                className={`${styles.stepContent} ${styles.stitchFormatStep}`}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h1 className={styles.stitchFormatTitle}>{t('steps.format.title')}</h1>
                                <p className={styles.stitchFormatSubtitle}>{t('steps.format.subtitle')}</p>

                                <div className={styles.stitchFormatPanel}>
                                    <div className={styles.stitchFormatGrid} role="group" aria-label={t('steps.format.title')}>
                                        <button
                                            type="button"
                                            className={`${styles.stitchFormatCard} ${styles.stitchFormatCardSquare} ${settings.printFormat === 'square' ? styles.stitchFormatCardSelected : ''}`}
                                            onClick={() => updateSettings('printFormat', 'square')}
                                            style={
                                                {
                                                    '--stitch-format-accent': '#ff2d9c',
                                                    '--stitch-format-accent-soft': 'rgba(255, 45, 156, 0.2)',
                                                } as React.CSSProperties
                                            }
                                        >
                                            <div className={styles.stitchFormatCardInner}>
                                                {settings.printFormat === 'square' && (
                                                    <span className={styles.stitchFormatCheck} aria-hidden="true">
                                                        <span className="material-symbols-outlined">check</span>
                                                    </span>
                                                )}

                                                <div className={styles.stitchFormatHero} aria-hidden="true">
                                                    <div className={styles.stitchFormatIconWrap}>
                                                        <span className={`material-symbols-outlined ${styles.stitchFormatPreviewIcon} ${styles.stitchFormatPreviewSquare}`} aria-hidden="true">square</span>
                                                        <span className={`${styles.stitchFormatIconLine} ${styles.stitchFormatIconLineBottom}`} aria-hidden="true" />
                                                        <span className={`${styles.stitchFormatIconLine} ${styles.stitchFormatIconLineTop}`} aria-hidden="true" />
                                                    </div>
                                                </div>

                                                <h3 className={styles.stitchFormatName}>
                                                    {t('steps.format.squareTitle', 'Square (8.5 x 8.5)')}
                                                </h3>
                                                <ul className={styles.stitchFormatBullets}>
                                                    <li>
                                                        <span className={`material-symbols-outlined ${styles.stitchFormatBulletIcon}`} aria-hidden="true">auto_awesome</span>
                                                        <span className={styles.stitchFormatBulletText}>{t('steps.format.squareBullets.0', 'Best for sharing and creative layouts')}</span>
                                                    </li>
                                                    <li>
                                                        <span className={`material-symbols-outlined ${styles.stitchFormatBulletIcon}`} aria-hidden="true">description</span>
                                                        <span className={styles.stitchFormatBulletText}>{t('steps.format.squareBullets.1', 'Includes 24 pages, Premium matte paper')}</span>
                                                    </li>
                                                    <li>
                                                        <span className={`material-symbols-outlined ${styles.stitchFormatBulletIcon}`} aria-hidden="true">favorite</span>
                                                        <span className={styles.stitchFormatBulletText}>{t('steps.format.squareBullets.2', 'Perfect for visual-heavy stories')}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            className={`${styles.stitchFormatCard} ${styles.stitchFormatCardPortrait} ${settings.printFormat === 'portrait' ? styles.stitchFormatCardSelected : ''}`}
                                            onClick={() => updateSettings('printFormat', 'portrait')}
                                            style={
                                                {
                                                    '--stitch-format-accent': '#2b2dff',
                                                    '--stitch-format-accent-soft': 'rgba(43, 45, 255, 0.2)',
                                                } as React.CSSProperties
                                            }
                                        >
                                            <div className={styles.stitchFormatCardInner}>
                                                {settings.printFormat === 'portrait' && (
                                                    <span className={styles.stitchFormatCheck} aria-hidden="true">
                                                        <span className="material-symbols-outlined">check</span>
                                                    </span>
                                                )}

                                                <div className={styles.stitchFormatHero} aria-hidden="true">
                                                    <div className={styles.stitchFormatIconWrap}>
                                                        <span className={`material-symbols-outlined ${styles.stitchFormatPreviewIcon} ${styles.stitchFormatPreviewPortrait}`} aria-hidden="true">crop_portrait</span>
                                                        <span className={`${styles.stitchFormatIconLine} ${styles.stitchFormatIconLineBottom}`} aria-hidden="true" />
                                                        <span className={`${styles.stitchFormatIconLine} ${styles.stitchFormatIconLineTop}`} aria-hidden="true" />
                                                    </div>
                                                </div>

                                                <h3 className={styles.stitchFormatName}>
                                                    {t('steps.format.portraitTitle', 'Portrait (8 x 10)')}
                                                </h3>
                                                <ul className={styles.stitchFormatBullets}>
                                                    <li>
                                                        <span className={`material-symbols-outlined ${styles.stitchFormatBulletIcon}`} aria-hidden="true">menu_book</span>
                                                        <span className={styles.stitchFormatBulletText}>{t('steps.format.portraitBullets.0', 'Classic storybook feel for bedside reading')}</span>
                                                    </li>
                                                    <li>
                                                        <span className={`material-symbols-outlined ${styles.stitchFormatBulletIcon}`} aria-hidden="true">description</span>
                                                        <span className={styles.stitchFormatBulletText}>{t('steps.format.portraitBullets.1', 'Includes 32 pages, Glossy finish option')}</span>
                                                    </li>
                                                    <li>
                                                        <span className={`material-symbols-outlined ${styles.stitchFormatBulletIcon}`} aria-hidden="true">text_fields</span>
                                                        <span className={styles.stitchFormatBulletText}>{t('steps.format.portraitBullets.2', 'Great for text-rich narratives')}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <p className={styles.stitchFormatNote}>
                                    {t('steps.format.note', 'Format controls image framing for print.')}
                                </p>
                            </motion.div>
                        )}

                        {currentStep === 'theme' && (
                            <motion.div
                                key="theme"
                                className={`${styles.stepContent} ${styles.stitchThemeStep}`}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h1 className={styles.stitchThemeTitle}>{t('steps.theme.title')}</h1>
                                <p className={styles.stitchThemeSubtitle}>{t('steps.theme.subtitle')}</p>

                                <div className={styles.stitchThemeGrid}>
                                    {(Object.keys(BookThemeInfo) as BookTheme[]).map((theme) => {
                                        const info = BookThemeInfo[theme];
                                        const isSelected = settings.bookTheme === theme;
                                        const accent = info.colors[0];
                                        const border = hexToRgba(accent, 0.25);
                                        const bg = hexToRgba(accent, 0.05);
                                        const symbol =
                                            theme === 'adventure' ? 'landscape' :
                                                theme === 'bedtime' ? 'bedtime' :
                                                    theme === 'learning' ? 'menu_book' :
                                                        theme === 'fantasy' ? 'auto_fix_high' :
                                                            theme === 'animals' ? 'pets' : 'add_circle';

                                        return (
                                            <button
                                                key={theme}
                                                type="button"
                                                className={`${styles.stitchThemeCard} ${isSelected ? styles.stitchThemeCardSelected : ''}`}
                                                onClick={() => updateSettings('bookTheme', theme)}
                                                style={{
                                                    '--stitch-accent': accent,
                                                    '--stitch-border': border,
                                                    '--stitch-bg': bg,
                                                } as React.CSSProperties}
                                            >
                                                <span className={styles.stitchThemeIconBox} aria-hidden="true">
                                                    <span className={`material-symbols-outlined ${styles.stitchThemeIcon}`}>{symbol}</span>
                                                </span>
                                                <span className={styles.stitchThemeName}>{t(`themes.${theme}`)}</span>
                                                {isSelected && (
                                                    <span className={styles.stitchThemeCheck} aria-hidden="true">
                                                        <span className="material-symbols-outlined">check</span>
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className={styles.stitchThemeDetails}>
                                    <div className={styles.stitchThemeDetailsTop}>
                                        <label className={styles.stitchThemeDetailsLabel} htmlFor="stitch-theme-details">
                                            {t('steps.theme.storyLabel')}
                                        </label>
                                        <span className={styles.stitchThemeCounter} aria-hidden="true">
                                            {themeDetailsCount} / 500
                                        </span>
                                    </div>
                                    <textarea
                                        id="stitch-theme-details"
                                        className={styles.stitchThemeTextarea}
                                        placeholder={t('steps.theme.storyPlaceholder')}
                                        value={themeDetails}
                                        onChange={(e) => updateSettings('storyDescription', e.target.value.slice(0, 500))}
                                        rows={4}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className={styles.stitchAdvancedToggle}
                                    onClick={() => setShowAdvancedStyle(v => !v)}
                                    aria-expanded={showAdvancedStyle}
                                >
                                    <span className={`material-symbols-outlined ${styles.stitchAdvancedIcon}`} aria-hidden="true">
                                        {showAdvancedStyle ? 'expand_less' : 'expand_more'}
                                    </span>
                                    {t('steps.style.advancedLabel', 'Advanced')}
                                </button>

                                {showAdvancedStyle && (
                                    <div className={styles.stitchAdvancedPanel}>
                                        <div className={styles.stitchAdvancedHeader}>
                                            <h3 className={styles.stitchAdvancedTitle}>{t('steps.style.compareTitle', 'Compare Art Styles')}</h3>
                                            <p className={styles.stitchAdvancedSubtitle}>{t('steps.style.compareSubtitle', "Pick the perfect look for your dragon's adventure.")}</p>
                                        </div>
                                        <div className={styles.stitchArtGrid}>
                                            {(Object.keys(ART_STYLES) as ArtStyle[]).map((style) => {
                                                const isSelected = settings.artStyle === style;
                                                return (
                                                    <button
                                                        key={style}
                                                        type="button"
                                                        className={`${styles.stitchArtCard} ${isSelected ? styles.stitchArtCardSelected : ''}`}
                                                        onClick={() => setSettings(prev => ({ ...prev, artStyle: style }))}
                                                        data-stitch-style={style}
                                                    >
                                                        <div className={styles.stitchArtImageWrap} aria-hidden="true">
                                                            <img
                                                                className={styles.stitchArtImage}
                                                                src={artStylePreviewSrc(style)}
                                                                alt=""
                                                                loading="lazy"
                                                                onError={(e) => {
                                                                    const img = e.currentTarget;
                                                                    img.onerror = null;
                                                                    img.src = '/images/dragon-hero.png';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className={styles.stitchArtMeta}>
                                                            <div className={styles.stitchArtName}>{t(`artStyles.${style}`)}</div>
                                                            <div className={styles.stitchArtDesc}>{artStyleDescriptor[style]}</div>
                                                        </div>
                                                        {isSelected && (
                                                            <span className={styles.stitchArtCheck} aria-hidden="true">
                                                                <span className="material-symbols-outlined">check</span>
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {currentStep === 'preview' && (
                            <motion.div
                                key="preview"
                                className={`${styles.stepContent} ${styles.stitchFinalStep}`}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className={styles.stitchFinalCoverWrap}>
                                    <div className={styles.stitchFinalCover}>
                                        <img
                                            className={styles.stitchFinalCoverImage}
                                            src={photoPreview || "/images/dragon-hero.png"}
                                            alt=""
                                        />
                                        <div className={styles.stitchFinalCoverOverlay}>
                                            <div className={styles.stitchFinalCoverTitle}>
                                                {settings.title || (settings.childName ? t('preview.defaultTitle', { childName: settings.childName }) : t('steps.title.titlePlaceholderDefault'))}
                                            </div>
                                            <div className={styles.stitchFinalCoverSubtitle}>
                                                {(settings.bookTheme ? t(`themes.${settings.bookTheme}`) : t('themes.adventure', 'Adventure')).toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.stitchFinalCards}>
                                    <div className={`${styles.stitchFinalCard} ${styles.stitchFinalCardHero}`}>
                                        <button
                                            type="button"
                                            className={styles.stitchFinalCardEdit}
                                            onClick={() => setCurrentStep('child')}
                                            aria-label={t('steps.child.edit', 'Edit hero')}
                                        >
                                            <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                                        </button>
                                        <div className={styles.stitchFinalCardIcon}>
                                            <span className="material-symbols-outlined" aria-hidden="true">face</span>
                                        </div>
                                        <div className={styles.stitchFinalCardLabel}>Hero</div>
                                        <div className={styles.stitchFinalCardValue}>
                                            {settings.childName || t('steps.child.namePlaceholder', 'Hero')}, {settings.childAge || 3}
                                        </div>
                                        <div className={styles.stitchFinalCardMeta}>
                                            {t('steps.child.photoMeta', 'Plush Dragon companion')}
                                        </div>
                                    </div>

                                    <div className={`${styles.stitchFinalCard} ${styles.stitchFinalCardFormat}`}>
                                        <button
                                            type="button"
                                            className={styles.stitchFinalCardEdit}
                                            onClick={() => setCurrentStep('format')}
                                            aria-label={t('steps.format.edit', 'Edit format')}
                                        >
                                            <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                                        </button>
                                        <div className={styles.stitchFinalCardIcon}>
                                            <span className="material-symbols-outlined" aria-hidden="true">menu_book</span>
                                        </div>
                                        <div className={styles.stitchFinalCardLabel}>Format</div>
                                        <div className={styles.stitchFinalCardValue}>
                                            {settings.printFormat === 'portrait' ? 'Portrait' : 'Square'}
                                        </div>
                                        <div className={styles.stitchFinalCardMeta}>
                                            {settings.printFormat === 'portrait' ? 'Premium 8 x 10' : 'Premium 8.5 x 8.5'}
                                        </div>
                                    </div>

                                    <div className={`${styles.stitchFinalCard} ${styles.stitchFinalCardTheme}`}>
                                        <button
                                            type="button"
                                            className={styles.stitchFinalCardEdit}
                                            onClick={() => setCurrentStep('theme')}
                                            aria-label={t('steps.theme.edit', 'Edit theme')}
                                        >
                                            <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                                        </button>
                                        <div className={styles.stitchFinalCardIcon}>
                                            <span className="material-symbols-outlined" aria-hidden="true">rocket_launch</span>
                                        </div>
                                        <div className={styles.stitchFinalCardLabel}>Theme</div>
                                        <div className={styles.stitchFinalCardValue}>
                                            {settings.bookTheme ? t(`themes.${settings.bookTheme}`) : t('themes.adventure', 'Adventure')}
                                        </div>
                                    </div>

                                    <div className={`${styles.stitchFinalCard} ${styles.stitchFinalCardStyle}`}>
                                        <button
                                            type="button"
                                            className={styles.stitchFinalCardEdit}
                                            onClick={() => {
                                                setShowAdvancedStyle(true);
                                                setCurrentStep('theme');
                                            }}
                                            aria-label={t('steps.style.edit', 'Edit style')}
                                        >
                                            <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                                        </button>
                                        <div className={styles.stitchFinalCardIcon}>
                                            <img
                                                src={settings.artStyle ? artStylePreviewSrc(settings.artStyle) : '/images/dragon-hero.png'}
                                                alt=""
                                            />
                                        </div>
                                        <div className={styles.stitchFinalCardLabel}>Style</div>
                                        <div className={styles.stitchFinalCardValue}>
                                            {settings.artStyle ? artStyleLabel(settings.artStyle) : t('steps.style.default', 'Watercolor')}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Action buttons */}
                <div className={`${styles.actions} ${styles.stitchActions}`}>
                    <button
                        className={`${styles.secondaryButton} ${styles.stitchBackButton}`}
                        onClick={handleBack}
                    >
                        <span className={`material-symbols-outlined ${styles.stitchBackIcon}`} aria-hidden="true">arrow_back</span>
                        <span className={styles.stitchBackLabel}>{backButtonLabel}</span>
                    </button>

                    <div className={styles.stitchActionsRight}>
                        {currentStep === 'theme' && showAdvancedStyle && settings.artStyle && (
                            <div className={styles.stitchSelectedHint} aria-hidden="true">
                                {t('steps.style.selectedHint', '{{style}} selected', { style: artStyleLabel(settings.artStyle) })}
                            </div>
                        )}
                        <div className={styles.stitchFooterCenter} aria-hidden="true">
                            <div className={styles.stitchFooterStep}>
                                {`STEP ${currentStepIndex + 1} OF ${steps.length}`}
                            </div>
                            <div className={styles.stitchFooterHint}>
                                {currentStepIndex === 0 ? t('wizard.footerStart', "Let's begin!") : t('wizard.footerAlmostThere', 'Almost there!')}
                            </div>
                        </div>

                        <button
                            className={`${styles.primaryButton} ${!canProceed() ? styles.disabled : ''} ${styles.stitchContinueButton}`}
                            onClick={handleNext}
                            disabled={!canProceed() || isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    {creatingStatus || t('status.generatingStory')}
                                </>
                            ) : currentStepIndex === steps.length - 1 ? (
                                t('buttons.generateBook', 'Generate Book')
                            ) : (
                                continueButtonLabel
                            )}
                            {!isCreating && currentStepIndex !== steps.length - 1 && (
                                <span className={`material-symbols-outlined ${styles.stitchContinueIcon}`} aria-hidden="true">auto_fix_normal</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Auth Modal */}
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                />

                {/* Magical Loading Overlay */}
                <BookCreationLoader
                    isActive={isCreating}
                    childName={settings.childName || ''}
                    hasPhoto={!!childPhoto}
                    phase={creatingPhase}
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
                            childGender: undefined,
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
