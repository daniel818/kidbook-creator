'use client';

import { Navbar } from '@/components/Navbar';
import { AboutHero } from '@/components/AboutHero';
import { TeamStory } from '@/components/TeamStory';
import { AboutCTA } from '@/components/AboutCTA';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <AboutHero />
        <TeamStory />
        <AboutCTA />
      </main>
    </>
  );
}
