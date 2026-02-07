# "Our Books" Library — Book Catalog

## Overview

This document defines the complete book template catalog for the "Our Books" library, including the filtering taxonomy, category structure, and all planned templates across children's and adult audiences. It consolidates research from `50-book-examples/` and expands the library with adult-themed titles.

**Total target: ~180 templates** across 5 audience segments and 14 theme categories.

---

## Filtering Taxonomy

### Primary Filter: Audience (mutually exclusive)

| Audience | Label | Age Range | Icon |
|----------|-------|-----------|------|
| `baby` | Baby & Toddler | 0–2 | 👶 |
| `preschool` | Preschool | 3–4 | 🧒 |
| `early_reader` | Early Reader | 5–6 | 📖 |
| `older_kids` | Older Kids | 7–12 | 🎒 |
| `adults` | Adults | 18+ | 💕 |

### Secondary Filter: Category Tags (multi-select)

| Tag | Label | Icon | Applicable Audiences |
|-----|-------|------|---------------------|
| `bedtime` | Bedtime | 🌙 | baby, preschool, early_reader |
| `adventure` | Adventure | 🚀 | all kids |
| `fantasy` | Fantasy & Magic | 🦄 | preschool, early_reader, older_kids |
| `animals` | Animals & Nature | 🦁 | all kids |
| `family` | Family & Emotions | 👨‍👩‍👧 | all |
| `holidays` | Holidays | 🎄 | all |
| `milestones` | Milestones & Firsts | 🎒 | baby, preschool, early_reader |
| `educational` | Learning & STEM | 📚 | all kids |
| `emotions` | Feelings & Social | 💛 | preschool, early_reader, older_kids |
| `humor` | Humor & Fun | 😂 | early_reader, older_kids, adults |
| `romance` | Romance & Love | ❤️ | adults |
| `careers` | Careers & Jobs | 👩‍🚒 | early_reader, older_kids |
| `sports` | Sports | ⚽ | early_reader, older_kids |
| `cultural` | Cultural & Heritage | 🕎 | all |

### Sort Options

| Sort Key | Label | Default |
|----------|-------|---------|
| `popular` | Popular | ✅ |
| `newest` | Newest | |
| `age_asc` | Age (youngest first) | |
| `alpha` | A → Z | |

---

## Category Rows (Display Order)

These are the curated horizontal rows shown on the default "Magical Bookshelf" view:

| # | Row Title | Filter Logic | Min Templates |
|---|-----------|-------------|---------------|
| 1 | ✨ Popular Stories | `is_featured = true` OR top 10 by `popularity_score` | 10 |
| 2 | 🌙 Bedtime Stories | `category = 'bedtime'` | 10 |
| 3 | 🦁 Animal Adventures | `category = 'animals'` | 10 |
| 4 | 🎒 Milestones & Firsts | `category = 'milestones'` | 12 |
| 5 | 🚀 Adventure & Fantasy | `category IN ('adventure','fantasy')` | 15 |
| 6 | 👨‍👩‍👧 Family & Emotions | `category IN ('family','emotions')` | 12 |
| 7 | 📚 Learning & STEM | `category = 'educational'` | 10 |
| 8 | 🎄 Holidays & Celebrations | `category = 'holidays'` | 12 |
| 9 | 💕 For Adults | `audience = 'adults'` | 30 |
| 10 | 🆕 New Arrivals | `ORDER BY created_at DESC LIMIT 10` | 10 |

---

## Template Catalog — Children's Books

### Baby & Toddler (Ages 0–2) — 30 Templates

| # | Title | Category | Tags | Priority |
|---|-------|----------|------|----------|
| 1 | Goodnight, [Name] | bedtime | bedtime, family | P1 |
| 2 | [Name]'s Animal Sounds | animals | animals, educational | P1 |
| 3 | I Love You, [Name] | family | family, emotions | P1 |
| 4 | [Name]'s First Words | educational | educational, milestones | P1 |
| 5 | Peek-a-Boo, [Name]! | milestones | milestones, humor | P1 |
| 6 | [Name]'s Colors and Shapes | educational | educational | P1 |
| 7 | Bath Time for [Name] | milestones | milestones, family | P1 |
| 8 | [Name] Meets the Farm Animals | animals | animals | P1 |
| 9 | Mommy/Daddy Loves [Name] | family | family, emotions | P1 |
| 10 | [Name]'s Counting Adventure | educational | educational | P2 |
| 11 | [Name] and the Seasons | educational | educational, animals | P2 |
| 12 | Sleepy Time for [Name] | bedtime | bedtime | P2 |
| 13 | [Name]'s Touch and Feel World | educational | educational | P2 |
| 14 | [Name]'s Funny Faces | humor | humor, emotions | P2 |
| 15 | [Name] Goes Vroom! | adventure | adventure | P2 |
| 16 | [Name]'s Body Parts | educational | educational | P2 |
| 17 | Who Loves [Name]? | family | family | P2 |
| 18 | [Name]'s Day at the Zoo | animals | animals | P2 |
| 19 | [Name] and the Rain | educational | educational | P3 |
| 20 | Little [Name], Big Hugs | emotions | emotions, family | P3 |
| 21 | [Name]'s Food Adventures | educational | educational, humor | P3 |
| 22 | [Name]'s Star Lullaby | bedtime | bedtime, fantasy | P3 |
| 23 | When [Name] Was Born | milestones | milestones, family | P3 |
| 24 | [Name]'s First Christmas | holidays | holidays, milestones | P3 |
| 25 | [Name] and the Butterflies | animals | animals | P3 |
| 26 | [Name]'s Melody | educational | educational | P3 |
| 27 | Getting Dressed with [Name] | milestones | milestones | P3 |
| 28 | [Name]'s New Sibling | family | family, milestones | P3 |
| 29 | [Name] and the Moon | bedtime | bedtime, fantasy | P3 |
| 30 | [Name]'s Eco Adventure | educational | educational, animals | P3 |

### Preschool (Ages 3–4) — 40 Templates

| # | Title | Category | Tags | Priority |
|---|-------|----------|------|----------|
| 1 | [Name]'s Magical Unicorn | fantasy | fantasy | P1 |
| 2 | Bye Bye Pacifier, [Name]! | milestones | milestones | P1 |
| 3 | [Name]'s First Day of School | milestones | milestones, emotions | P1 |
| 4 | [Name] and the Dinosaurs | adventure | adventure, animals | P1 |
| 5 | The Brave Little [Name] | emotions | emotions, adventure | P1 |
| 6 | [Name] Makes a Friend | emotions | emotions | P1 |
| 7 | Potty Time for [Name] | milestones | milestones | P1 |
| 8 | [Name] and the Princess Castle | fantasy | fantasy | P1 |
| 9 | [Name]'s Birthday Surprise | holidays | holidays | P1 |
| 10 | [Name] the Superhero | adventure | adventure, fantasy | P1 |
| 11 | [Name]'s Kindness Adventure | emotions | emotions | P1 |
| 12 | [Name] at Grandma's Kitchen | family | family, cultural | P1 |
| 13 | [Name] and the Magic Garden | fantasy | fantasy, animals | P2 |
| 14 | [Name] Learns to Share | emotions | emotions | P2 |
| 15 | [Name]'s Trip to Space | adventure | adventure, educational | P2 |
| 16 | [Name] and the Silly Monsters | humor | humor, fantasy | P2 |
| 17 | [Name] Visits the Doctor | milestones | milestones | P2 |
| 18 | [Name]'s Imaginary Friend | fantasy | fantasy, emotions | P2 |
| 19 | [Name] Saves the Jungle | adventure | adventure, animals | P2 |
| 20 | [Name]'s Pirate Treasure | adventure | adventure | P2 |
| 21 | [Name] and the Rainbow | fantasy | fantasy, educational | P2 |
| 22 | Big Brother/Sister [Name] | family | family, milestones | P2 |
| 23 | [Name]'s Easter Egg Hunt | holidays | holidays | P2 |
| 24 | [Name]'s Halloween Night | holidays | holidays, adventure | P2 |
| 25 | [Name]'s Christmas Wish | holidays | holidays, family | P2 |
| 26 | [Name] at the Beach | adventure | adventure | P2 |
| 27 | [Name] and the Fireflies | bedtime | bedtime, animals | P2 |
| 28 | [Name]'s Fairy Wings | fantasy | fantasy | P3 |
| 29 | [Name] Helps the Animals | animals | animals, emotions | P3 |
| 30 | [Name]'s Manners Book | educational | educational, emotions | P3 |
| 31 | [Name] and the Dragon Friend | fantasy | fantasy | P3 |
| 32 | [Name]'s Color Splash | educational | educational | P3 |
| 33 | [Name] and the Singing Birds | animals | animals | P3 |
| 34 | [Name]'s Hanukkah Candles | holidays | holidays, cultural | P3 |
| 35 | [Name]'s Diwali Lights | holidays | holidays, cultural | P3 |
| 36 | [Name]'s Eid Celebration | holidays | holidays, cultural | P3 |
| 37 | [Name] and the Shy Kitten | animals | animals, emotions | P3 |
| 38 | [Name]'s Camping Night | adventure | adventure, bedtime | P3 |
| 39 | [Name] the Explorer | adventure | adventure, educational | P3 |
| 40 | [Name]'s Feelings Book | emotions | emotions | P3 |

### Early Reader (Ages 5–6) — 35 Templates

| # | Title | Category | Tags | Priority |
|---|-------|----------|------|----------|
| 1 | [Name] the Firefighter | careers | careers, adventure | P1 |
| 2 | [Name] Learns to Ride a Bike | milestones | milestones | P1 |
| 3 | [Name] and the Lost Tooth | milestones | milestones, humor | P1 |
| 4 | [Name]'s Secret Mission | adventure | adventure | P1 |
| 5 | [Name] Joins the Soccer Team | sports | sports | P1 |
| 6 | [Name]'s Science Experiment | educational | educational | P1 |
| 7 | [Name] the Detective | adventure | adventure, humor | P1 |
| 8 | [Name] and the Robot Friend | educational | educational, fantasy | P1 |
| 9 | [Name]'s ABC Adventure | educational | educational | P1 |
| 10 | [Name] and the Enchanted Forest | fantasy | fantasy, adventure | P1 |
| 11 | [Name] Swims with Dolphins | animals | animals, adventure | P2 |
| 12 | [Name] the Chef | careers | careers | P2 |
| 13 | [Name] and the Time Machine | adventure | adventure, fantasy | P2 |
| 14 | [Name]'s First Sleepover | milestones | milestones, emotions | P2 |
| 15 | [Name] Goes to the Circus | adventure | adventure, humor | P2 |
| 16 | [Name] and the Talking Animals | fantasy | fantasy, animals | P2 |
| 17 | [Name] the Astronaut | careers | careers, adventure | P2 |
| 18 | [Name] Builds a Treehouse | adventure | adventure | P2 |
| 19 | [Name]'s Music Band | educational | educational | P2 |
| 20 | [Name] and the Weather Machine | educational | educational, adventure | P2 |
| 21 | [Name] the Veterinarian | careers | careers, animals | P2 |
| 22 | [Name] and the Map | adventure | adventure | P3 |
| 23 | [Name]'s Garden of Wonders | animals | animals, educational | P3 |
| 24 | [Name] at the Olympics | sports | sports | P3 |
| 25 | [Name] and the Coral Reef | animals | animals, educational | P3 |
| 26 | [Name] the Inventor | educational | educational, careers | P3 |
| 27 | [Name]'s Art Gallery | educational | educational | P3 |
| 28 | [Name] and the Volcano | adventure | adventure, educational | P3 |
| 29 | [Name] the Pilot | careers | careers, adventure | P3 |
| 30 | [Name] and the Magic Library | fantasy | fantasy, educational | P3 |
| 31 | [Name] Visits the Pyramids | adventure | adventure, educational | P3 |
| 32 | [Name] the Knight | fantasy | fantasy, adventure | P3 |
| 33 | [Name]'s Rainy Day Fun | humor | humor | P3 |
| 34 | [Name] and the Dancing Shoes | fantasy | fantasy, humor | P3 |
| 35 | [Name] Saves the Ocean | animals | animals, educational | P3 |

### Older Kids (Ages 7–12) — 35 Templates

| # | Title | Category | Tags | Priority |
|---|-------|----------|------|----------|
| 1 | [Name]'s Epic Quest | adventure | adventure, fantasy | P1 |
| 2 | The Mystery of [Name]'s School | adventure | adventure, humor | P1 |
| 3 | [Name]: Champion of the League | sports | sports | P1 |
| 4 | [Name] and the Dragon's Riddle | fantasy | fantasy | P1 |
| 5 | [Name]'s Diary of a Wild Week | humor | humor | P1 |
| 6 | [Name] Travels Through Time | adventure | adventure, educational | P1 |
| 7 | [Name] and the Code Breaker | educational | educational, adventure | P1 |
| 8 | [Name]: Finding My Voice | emotions | emotions | P1 |
| 9 | [Name] the Young Scientist | educational | educational, careers | P1 |
| 10 | [Name]'s Survival Island | adventure | adventure | P1 |
| 11 | [Name] and the Ghost House | humor | humor, adventure | P2 |
| 12 | [Name] the Spy | adventure | adventure | P2 |
| 13 | [Name]'s Band of Heroes | fantasy | fantasy, emotions | P2 |
| 14 | [Name] and the Alien Signal | adventure | adventure, educational | P2 |
| 15 | [Name]'s Cooking Challenge | humor | humor, careers | P2 |
| 16 | [Name] and the Ancient Map | adventure | adventure, educational | P2 |
| 17 | [Name] Stands Up | emotions | emotions | P2 |
| 18 | [Name] the Gamer Hero | adventure | adventure, humor | P2 |
| 19 | [Name]'s World Record | sports | sports, humor | P2 |
| 20 | [Name] and the Enchanted Kingdom | fantasy | fantasy | P2 |
| 21 | [Name]'s Climate Mission | educational | educational, adventure | P3 |
| 22 | [Name] the Reporter | careers | careers | P3 |
| 23 | [Name] and the Robot Uprising | adventure | adventure, educational | P3 |
| 24 | [Name]'s First Crush | emotions | emotions, humor | P3 |
| 25 | [Name] the Architect | careers | careers, educational | P3 |
| 26 | [Name] and the Forbidden Library | fantasy | fantasy, adventure | P3 |
| 27 | [Name]'s Identity Journey | emotions | emotions | P3 |
| 28 | [Name] vs. the Bully | emotions | emotions | P3 |
| 29 | [Name]'s Pet Rescue | animals | animals, emotions | P3 |
| 30 | [Name] at Space Camp | adventure | adventure, educational | P3 |
| 31 | [Name] and the Viking Ship | adventure | adventure, educational | P3 |
| 32 | [Name]'s Film Festival | educational | educational, humor | P3 |
| 33 | [Name] the Parkour Runner | sports | sports, adventure | P3 |
| 34 | [Name] and the Mystery Train | adventure | adventure | P3 |
| 35 | [Name]'s Escape Room | adventure | adventure, humor | P3 |

---

## Template Catalog — Adult Books (NEW)

### Adults — Romance & Couples (10 Templates)

| # | Title | Category | Tags | Priority |
|---|-------|----------|------|----------|
| 1 | Why I Love [Partner Name] | romance | romance, family | P1 |
| 2 | [Name] & [Partner]'s Love Story | romance | romance | P1 |
| 3 | 10 Reasons I'm Crazy About [Name] | romance | romance, humor | P1 |
| 4 | Our First Year Together | romance | romance, milestones | P2 |
| 5 | Happy Anniversary, [Name] | romance | romance, holidays | P2 |
| 6 | [Name], Will You Marry Me? | romance | romance, milestones | P2 |
| 7 | The Day I Knew You Were The One | romance | romance | P2 |
| 8 | Growing Old With [Name] | romance | romance, family | P3 |
| 9 | Valentine's Day With [Name] | romance | romance, holidays | P3 |
| 10 | Long-Distance Love: [Name] & [Partner] | romance | romance | P3 |

### Adults — Super Parents & Family (10 Templates)

| # | Title | Category | Tags | Priority |
|---|-------|----------|------|----------|
| 1 | Super Dad [Name] Saves the Day | family | family, humor | P1 |
| 2 | Super Mom [Name] to the Rescue | family | family, humor | P1 |
| 3 | [Name]: World's Best Grandma | family | family | P1 |
| 4 | [Name]: World's Best Grandpa | family | family | P1 |
| 5 | Thank You, [Parent Name], For Everything | family | family, emotions | P2 |
| 6 | A Letter From [Child Name] to Mom/Dad | family | family, emotions | P2 |
| 7 | The Grandparent Who Could Do Anything | family | family, humor | P2 |
| 8 | [Name] Becomes a Parent | family | family, milestones | P3 |
| 9 | Our Family Recipe Book | family | family, cultural | P3 |
| 10 | The Day [Grandparent] Told Me a Secret | family | family | P3 |

### Adults — Humor & Fun (10 Templates)

| # | Title | Category | Tags | Priority |
|---|-------|----------|------|----------|
| 1 | [Name]'s Survival Guide to Turning 30/40/50 | humor | humor, milestones | P1 |
| 2 | The Legend of [Name]: Office Hero | humor | humor | P1 |
| 3 | [Name]'s Retirement Adventure | humor | humor, milestones | P1 |
| 4 | What [Name] Does When Nobody's Looking | humor | humor | P2 |
| 5 | [Name] vs. The Monday Morning | humor | humor | P2 |
| 6 | The Extraordinary Life of Ordinary [Name] | humor | humor | P2 |
| 7 | [Name]'s Guide to Being the Best Friend | humor | humor, emotions | P3 |
| 8 | Why [Name] Deserves a Vacation | humor | humor | P3 |
| 9 | [Name] and the Mystery of the Missing Socks | humor | humor | P3 |
| 10 | Congrats, Graduate [Name]! | humor | humor, milestones | P3 |

---

## Template Count Summary

| Audience | P1 | P2 | P3 | Total |
|----------|-----|-----|-----|-------|
| Baby & Toddler (0–2) | 9 | 9 | 12 | **30** |
| Preschool (3–4) | 12 | 15 | 13 | **40** |
| Early Reader (5–6) | 10 | 11 | 14 | **35** |
| Older Kids (7–12) | 10 | 10 | 15 | **35** |
| Adults — Romance | 3 | 4 | 3 | **10** |
| Adults — Family | 4 | 3 | 3 | **10** |
| Adults — Humor | 3 | 3 | 4 | **10** |
| **Total** | **51** | **55** | **64** | **170** |

### Phased Rollout

| Phase | Templates | Source |
|-------|-----------|--------|
| **Launch (v1)** | 51 P1 templates | Seed data in Supabase migration |
| **Month 1** | + 55 P2 templates | Admin panel or migration |
| **Month 2–3** | + 64 P3 templates | Admin panel or migration |
| **Ongoing** | Seasonal + trending | As needed |

---

## Tag Distribution

| Tag | Baby | Preschool | Early Reader | Older Kids | Adults | Total |
|-----|------|-----------|-------------|------------|--------|-------|
| adventure | 1 | 10 | 14 | 20 | 0 | **45** |
| fantasy | 1 | 9 | 6 | 6 | 0 | **22** |
| educational | 10 | 4 | 11 | 5 | 0 | **30** |
| emotions | 2 | 6 | 2 | 6 | 3 | **19** |
| family | 5 | 3 | 0 | 0 | 9 | **17** |
| animals | 5 | 5 | 5 | 1 | 0 | **16** |
| milestones | 4 | 4 | 3 | 0 | 4 | **15** |
| humor | 1 | 2 | 3 | 6 | 9 | **21** |
| holidays | 1 | 5 | 0 | 0 | 2 | **8** |
| careers | 0 | 0 | 6 | 3 | 0 | **9** |
| sports | 0 | 0 | 2 | 3 | 0 | **5** |
| romance | 0 | 0 | 0 | 0 | 10 | **10** |
| cultural | 0 | 2 | 0 | 0 | 1 | **3** |
| bedtime | 4 | 2 | 0 | 0 | 0 | **6** |

---

## Localization Notes

- All template `title` and `description` fields will support i18n via a JSONB column or separate localization table
- **Phase 1 languages:** English (en), German (de), Hebrew (he) — matching existing app support
- Hebrew templates should include culturally relevant themes (Hanukkah, Israeli holidays, Hebrew naming conventions)
- RTL layout support already exists in the app (`[dir="rtl"]` CSS rules)

---

## References

- Source research: `00-project-overview/50-book-examples/17-TOP-100-BOOKS-RECOMMENDATIONS.md`
- Competitor catalog: `00-project-overview/50-book-examples/14-COMPETITOR-BOOK-EXAMPLES.md`
- Age group themes: `00-project-overview/50-book-examples/15-SUCCESSFUL-BOOKS-BY-AGE-GROUP.md`
- Consolidated themes: `00-project-overview/50-book-examples/16-CONSOLIDATED-BOOK-THEMES-CATALOG.md`
