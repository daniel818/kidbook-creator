'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import styles from './page.module.css';

type WizardStep = 'child' | 'type' | 'format' | 'theme' | 'style' | 'title';

export default function CreateBookPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useAuth();
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

    // Track unsaved changes
    useEffect(() => {
        const hasData = settings.childName || settings.bookType || settings.bookTheme || settings.artStyle || settings.title || childPhoto;
        setHasUnsavedChanges(!!hasData);
    }, [settings, childPhoto]);

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
        if (pendingCreate && user && !showAuthModal && !isAuthLoading) {
            // Wait a bit for auth state to fully stabilize
            const timer = setTimeout(() => {
                setPendingCreate(false);
                handleCreate();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [user, pendingCreate, showAuthModal, isAuthLoading]);

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
                setCreatingStatus('Analyzing photo...');
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
            console.log('[CLIENT] Step 2: Calling generate-book API...');
            const genStart = Date.now();
            setCreatingStatus('Creating your magical story...');

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
            setCreatingStatus('Opening your book...');
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
            alert('Failed to create book. Please try again.');
        }
    };

    const updateSettings = <K extends keyof BookSettings>(key: K, value: BookSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                {/* Auth Modal for deferred authentication */}
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => {
                        setShowAuthModal(false);
                        setPendingCreate(false);
                    }}
                />

                {/* Loading overlay during book creation */}
                {isCreating && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.loadingCard}>
                            <div className={styles.starsContainer}>
                                <span className={styles.star} style={{ animationDelay: '0s' }}>✨</span>
                                <span className={styles.star} style={{ animationDelay: '0.3s' }}>⭐</span>
                                <span className={styles.star} style={{ animationDelay: '0.6s' }}>✨</span>
                            </div>
                            <h2 className={styles.loadingTitle}>Creating Your Book</h2>
                            <p className={styles.loadingStatus}>
                                {creatingStatus}
                                <span className={styles.dots}>
                                    <span style={{ animationDelay: '0s' }}>.</span>
                                    <span style={{ animationDelay: '0.2s' }}>.</span>
                                    <span style={{ animationDelay: '0.4s' }}>.</span>
                                </span>
                            </p>
                            <div className={styles.progressBarContainer}>
                                <div className={styles.progressBarFill}></div>
                            </div>
                        </div>
                    </div>
                )}

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
                    ← Back
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
                            <h1 className={styles.stepTitle}>Who is this book for?</h1>
                            <p className={styles.stepSubtitle}>
                                Tell us about the special child who will enjoy this book
                            </p>

                            <div className={styles.formFields}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Child&apos;s Name</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="Enter name..."
                                        value={settings.childName || ''}
                                        onChange={(e) => updateSettings('childName', e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        Age: <span className={styles.ageValue}>{settings.childAge} years</span>
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
                                        📷 Upload a photo (optional)
                                    </label>
                                    <p className={styles.inputHint} style={{ marginBottom: '0.5rem' }}>
                                        Upload a photo to create a character that looks like your child
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
                                        {childPhoto ? '📷 Change Photo' : '📷 Add Photo'}
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
                            <h1 className={styles.stepTitle}>Choose a book type</h1>
                            <p className={styles.stepSubtitle}>
                                Select the perfect format for {settings.childName || 'your child'}
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
                                            <h3 className={styles.optionTitle}>{info.label}</h3>
                                            <p className={styles.optionDesc}>{info.description}</p>
                                            <span className={styles.optionAge}>{info.ageRange}</span>
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
                            <h1 className={styles.stepTitle}>Choose a Format</h1>
                            <p className={styles.stepSubtitle}>
                                Prepare your book for professional printing
                            </p>

                            <div className={styles.optionsGrid}>
                                <button
                                    className={`${styles.optionCard} ${settings.printFormat === 'square' ? styles.selected : ''}`}
                                    onClick={() => updateSettings('printFormat', 'square')}
                                    style={{ '--option-color': '#ec4899' } as React.CSSProperties}
                                >
                                    <span className={styles.optionEmoji}>✨</span>
                                    <h3 className={styles.optionTitle}>Square Hardcover</h3>
                                    <p className={styles.optionDesc}>8.5&quot; x 8.5&quot; Premium. The gold standard for kids&apos; books.</p>
                                    <span className={styles.optionAge}>Min 24 Pages (Auto-set)</span>
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
                                    <h3 className={styles.optionTitle}>Portrait / Digital</h3>
                                    <p className={styles.optionDesc}>6&quot; x 9&quot; Standard. Great for softcover or phones.</p>
                                    <span className={styles.optionAge}>Flexible Pages</span>
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
                            <h1 className={styles.stepTitle}>Pick a theme</h1>
                            <p className={styles.stepSubtitle}>
                                What kind of story will this be?
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
                                            <span className={styles.themeName}>{info.label}</span>
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
                                        Tell us more about the story (optional)
                                    </label>
                                    <textarea
                                        className={styles.formInput}
                                        placeholder="e.g. I want the story to be about learning to share with friends, and feature a friendly dragon."
                                        value={settings.storyDescription || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, storyDescription: e.target.value }))}
                                        rows={3}
                                        style={{ resize: 'vertical' }}
                                    />
                                    <p className={styles.inputHint}>
                                        We&apos;ll use this to make the story even more personal!
                                    </p>
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
                            <h1 className={styles.stepTitle}>Choose an art style</h1>
                            <p className={styles.stepSubtitle}>
                                How should your book&apos;s illustrations look?
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
                                            <span className={styles.themeName}>{info.label}</span>
                                            {settings.artStyle === style && (
                                                <span className={styles.checkmark}>✓</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className={styles.qualitySection} style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <label className={styles.fieldLabel} style={{ display: 'block', marginBottom: '1rem', fontWeight: 600, color: '#1e293b' }}>
                                    ✨ Image Quality
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
                                        ⚡ Fast (Standard)
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
                                        💎 Pro (Imagen 4 Ultra)
                                    </button>
                                </div>
                                <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                                    {settings.imageQuality === 'pro'
                                        ? "Pro mode uses Imagen 4 Ultra for stunning, high-definition illustrations. Takes a bit longer to generate."
                                        : "Standard mode generates beautiful images quickly using Imagen 4."}
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
                            <h1 className={styles.stepTitle}>Name your book</h1>
                            <p className={styles.stepSubtitle}>
                                Give your story an amazing title
                            </p>

                            <div className={styles.formFields}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Book Title</label>
                                    <input
                                        type="text"
                                        className={`${styles.formInput} ${styles.titleInput}`}
                                        placeholder={`${settings.childName}'s Amazing Adventure`}
                                        value={settings.title || ''}
                                        onChange={(e) => updateSettings('title', e.target.value)}
                                        autoFocus
                                    />
                                    <p className={styles.inputHint}>
                                        Leave empty to use the default title
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
                                            {settings.title || `${settings.childName}'s Amazing Adventure`}
                                        </span>
                                    </div>
                                    <div className={styles.previewInfo}>
                                        <p>For {settings.childName}, age {settings.childAge}</p>
                                        <p>{settings.bookType && BookTypeInfo[settings.bookType].label}</p>
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
                    {currentStepIndex === 0 ? 'Cancel' : 'Back'}
                </button>

                <button
                    className={`${styles.primaryButton} ${!canProceed() ? styles.disabled : ''}`}
                    onClick={handleNext}
                    disabled={!canProceed() || isCreating}
                >
                    {isCreating ? (
                        <>
                            <span className={styles.spinner}></span>
                            {creatingStatus || 'Creating...'}
                        </>
                    ) : currentStepIndex === steps.length - 1 ? (
                        <>
                            ✨ Generate Book with AI
                            <span>🚀</span>
                        </>
                    ) : (
                        <>
                            Continue
                            <span>→</span>
                        </>
                    )}
                </button>
            </div>
        </main>
        </>
    );
}
