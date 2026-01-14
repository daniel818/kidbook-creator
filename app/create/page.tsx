'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookSettings,
    BookType,
    BookTheme,
    BookTypeInfo,
    BookThemeInfo,
    getAgeGroup,
    createNewBook
} from '@/lib/types';
import { saveBook, setCurrentBook } from '@/lib/storage';
import styles from './page.module.css';

type WizardStep = 'child' | 'type' | 'theme' | 'title';

export default function CreateBookPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<WizardStep>('child');
    const [settings, setSettings] = useState<Partial<BookSettings>>({
        childName: '',
        childAge: 3,
        bookType: undefined,
        bookTheme: undefined,
        title: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    const steps: WizardStep[] = ['child', 'type', 'theme', 'title'];
    const currentStepIndex = steps.indexOf(currentStep);

    const canProceed = () => {
        switch (currentStep) {
            case 'child':
                return settings.childName && settings.childName.trim().length > 0;
            case 'type':
                return settings.bookType !== undefined;
            case 'theme':
                return settings.bookTheme !== undefined;
            case 'title':
                return true; // Title is optional
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (!canProceed()) return;

        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex]);
        } else {
            handleCreate();
        }
    };

    const handleBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex]);
        } else {
            router.push('/');
        }
    };

    const handleCreate = async () => {
        setIsCreating(true);

        const finalSettings: BookSettings = {
            childName: settings.childName || 'My Child',
            childAge: settings.childAge || 3,
            ageGroup: getAgeGroup(settings.childAge || 3),
            bookType: settings.bookType || 'picture',
            bookTheme: settings.bookTheme || 'custom',
            title: settings.title || `${settings.childName}'s Amazing Adventure`
        };

        const newBook = createNewBook(finalSettings);
        saveBook(newBook);
        setCurrentBook(newBook.id);

        // Small delay for animation
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push(`/create/${newBook.id}`);
    };

    const updateSettings = <K extends keyof BookSettings>(key: K, value: BookSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <main className={styles.main}>
            {/* Background */}
            <div className={styles.background}>
                <div className={styles.bgShape1}></div>
                <div className={styles.bgShape2}></div>
            </div>

            {/* Header */}
            <header className={styles.header}>
                <button className={styles.backButton} onClick={handleBack}>
                    ← Back
                </button>
                <div className={styles.logo}>
                    <span>📚</span> KidBook Creator
                </div>
                <div className={styles.placeholder}></div>
            </header>

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
                            Creating...
                        </>
                    ) : currentStepIndex === steps.length - 1 ? (
                        <>
                            Create Book
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
    );
}
