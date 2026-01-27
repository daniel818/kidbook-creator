'use client';

import { Navbar } from '@/components/Navbar';
import { AboutHero } from '@/components/AboutHero';
import { TeamStory } from '@/components/TeamStory';
import { TeamPhotos } from '@/components/TeamPhotos';
import { ValuesGrid } from '@/components/ValuesGrid';
import { TeamPhotos2 } from '@/components/TeamPhotos2';
import { AboutCTA } from '@/components/AboutCTA';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <AboutHero />
        <TeamStory />
        <TeamPhotos />
        <ValuesGrid />
        <TeamPhotos2 />
        <AboutCTA />
      </main>
    </>
  );
}
