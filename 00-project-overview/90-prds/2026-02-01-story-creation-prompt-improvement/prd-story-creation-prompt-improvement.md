# PRD: Story Creation Prompt Improvement

**Document Version:** 2.0  
**Created:** February 1, 2026  
**Status:** Draft - Awaiting Approval  
**Owner:** Product & AI Team

---

## Executive Summary

This PRD defines a systematic approach to improve the story generation prompt structure for KidBook Creator. The goal is to achieve consistently high-quality, age-appropriate, and safe story generation across all book types and themes.

### Key Objectives
1. **Quality:** Achieve 90%+ story quality success rate based on defined evaluation criteria
2. **Safety:** Reduce inappropriate content generation to <0.1%
3. **Consistency:** Ensure narrative coherence and age-appropriateness for every story
4. **Measurability:** Establish evaluation framework with automated scoring and DB logging

### Scope
- **In Scope:** Story generation prompt (`getStoryPrompt()`) improvements, evaluation framework, validation system, local A/B testing
- **Out of Scope:** Image generation prompts (working well), user-facing quality features, feedback loops, multi-language (English first, then expand)

### Phased Approach
| Phase | Description | Duration |
|-------|-------------|----------|
| **Phase 1** | Design enhanced prompt template (English only) | Week 1-2 |
| **Phase 2** | Local A/B testing with defined story requests | Week 3-4 |
| **Phase 3** | Prompt iteration based on learnings | Week 5 |
| **Phase 4** | Second A/B test comparing all versions | Week 6 |
| **Phase 5** | Production implementation with evals & DB logging | Week 7-8 |

### Key Decisions Made
- ✅ English-only first, expand after validation
- ✅ 10-20% longer generation time acceptable for quality
- ✅ All stories get evaluation logged to DB (30-day retention)
- ✅ Optional validation prompt (can add 1 more prompt if needed)
- ✅ No code changes until Phase 5 - all testing done locally
- ✅ Image prompts are out of scope (working well)
- ✅ No user-facing quality scores or regeneration options

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Book Structure & Narrative Framework](#2-book-structure--narrative-framework)
3. [Age-Specific Guidelines](#3-age-specific-guidelines)
4. [Theme-Specific Guidelines](#4-theme-specific-guidelines)
5. [Content Safety Rules](#5-content-safety-rules)
6. [Evaluation Framework](#6-evaluation-framework)
7. [Implementation Phases](#7-implementation-phases)
8. [Prompt Template Structure](#8-prompt-template-structure)
9. [Technical Requirements](#9-technical-requirements)
10. [Image Generation Notes](#10-image-generation-notes)

---

## 1. Current State Analysis

### 1.1 Current User Journey

| Step | Description | Current Status |
|------|-------------|----------------|
| **a** | Child's name and photo upload | ✅ Working |
| **b** | Book type selection (board/picture/story/alphabet) | ✅ Working |
| **c** | Theme selection (Adventure, Bedtime, Learning, Fantasy, Animals, Custom) | ✅ Working |
| **d** | Story description - human input about the story | ✅ Working |
| **e** | Generation - creates story text + 2 preview illustrations | ✅ Working |
| **f** | Purchase (digital/print) → completes remaining illustrations | ✅ Working |

### 1.2 Current Prompt Architecture

**Reference:** See [prompt-breakdown.md](./prompt-breakdown.md) for detailed breakdown.

**Summary:**
- **Story Generation:** 1 prompt to `gemini-3-flash-preview`
- **Character Extraction:** 1 prompt (only if photo provided)
- **Image Generation:** 14 prompts total (1 cover + 12 story + 1 back cover)
- **Total:** 15-16 prompts per book

### 1.3 Current Prompt Structure (English)

```typescript
// Location: lib/gemini/prompts/en.ts
getStoryPrompt({
  childName, childAge, bookTheme, bookType, pageCount,
  characterDescription?, storyDescription?
})
```

**Current Strengths:**
- ✅ Multi-language support structure
- ✅ JSON output format
- ✅ Character description passthrough
- ✅ Language enforcement instructions

**Current Gaps:**
- ❌ No age-specific writing guidelines
- ❌ No theme-specific narrative structure
- ❌ No explicit content safety rules in prompt
- ❌ No narrative arc framework for 12 pages
- ❌ No evaluation or quality validation
- ❌ No DB logging of story quality

---

## 2. Book Structure & Narrative Framework

### 2.1 Fixed Book Structure

Every book follows this **exact structure**:

| Element | Content | Illustration |
|---------|---------|--------------|
| **Cover** | Book title + exciting headline | 1 cover image |
| **Pages 1-12** | Story text (12 pages) | 12 story illustrations |
| **Back Cover** | "The End" + engaging summary | 1 back cover image |

**Total:** 14 illustrations (1 cover + 12 story + 1 back cover)

### 2.2 Narrative Arc for 12 Pages

The story MUST follow this structure across exactly 12 pages:

| Pages | Narrative Phase | Purpose | Example |
|-------|-----------------|---------|---------|
| **1-2** | **Introduction** | Establish character, setting, ordinary world | "Emma loved her garden. Every morning, she would water her flowers and say hello to the butterflies." |
| **3** | **Inciting Incident** | Something changes, adventure begins | "One day, Emma found a tiny door hidden behind the rose bush!" |
| **4-6** | **Rising Action** | Challenges, discoveries, new friends | "Inside, she met a friendly ladybug named Lola who needed help finding her way home." |
| **7-8** | **Climax** | Biggest challenge, turning point | "The path was blocked by a rushing stream! Emma had to think of a clever way across." |
| **9-10** | **Falling Action** | Problem solving, resolution begins | "Using a big leaf as a boat, Emma and Lola floated safely to the other side." |
| **11** | **Resolution** | Problem solved, lesson learned | "Lola was finally home! She thanked Emma with the biggest ladybug hug." |
| **12** | **Conclusion** | Return home, reflection, positive ending | "Emma walked back through the tiny door, knowing she had made a friend for life." |

### 2.3 Cover & Back Cover Content

**Cover Requirements:**
- **Title:** Engaging, age-appropriate book title
- **Headline:** Exciting tagline (e.g., "A Magical Garden Adventure!")
- **Image Prompt:** Scene that captures the story's essence with the main character

**Back Cover Requirements:**
- **"The End"** text
- **Summary:** 2-3 sentence engaging blurb about the child and story
- **Example:** "Blondy is a joyful three-year-old with a lot of love to give. Join her in the garden as she discovers that the best way to make a friend is to be kind and caring."

---

## 3. Age-Specific Guidelines

**Reference:** See [word-sentence-length-age-groups.md](./word-sentence-length-age-groups.md) for complete developmental analysis.

### 3.1 Age Group Summary Table

| Age Group | Words/Page | Sentence Length | Primary Structure | Key DO | Key DON'T |
|-----------|------------|-----------------|-------------------|--------|-----------|
| **0-2 (Board)** | 0-10 | 1-5 words | Labels/Short phrases | Use onomatopoeia | No metaphors or irony |
| **3-4 (Picture)** | 10-50 | 5-10 words | Rhythmic narrative | Use refrains for participation | No preachy morals |
| **5-6 (Early Reader)** | 5-40 | 2-8 words | Simple/Repetitive | Short, punchy sentences | No line breaks mid-sentence |
| **7-8 (Chapter)** | 50-150 | 7-12 words | Plot-driven/Dialogue | Use humor and action | No dense internal monologues |
| **9-12 (Middle Grade)** | 150-250 | 10-20 words | Theme-driven/Nuanced | Tackle complex themes | Don't talk down to reader |

### 3.2 Detailed Age Guidelines

#### Ages 0-2: "The Sensory Explorer" (Board Books)

**Goal:** Establishing object permanence and basic vocabulary

**Writing Rules:**
- ✅ Use onomatopoeia (*Moo, Vroom, Beep*)
- ✅ Use rhythm and sing-song cadences
- ✅ Focus on anchor words (Ball, Dog, Mom, Cup)
- ❌ No pronouns without clear visual reference
- ❌ No metaphors (literal interpretation)
- ❌ No more than one main idea per page

**Example Page:** "Splash! The duck goes in the pond."

#### Ages 3-4: "The Curious Listener" (Picture Books)

**Goal:** Developing narrative logic and emotional empathy

**Writing Rules:**
- ✅ Include refrains for read-along participation
- ✅ Use rich, descriptive "juicy" words (glistening, colossal)
- ✅ Ensure illustrations complement but don't duplicate text
- ❌ No walls of text (child will get bored)
- ❌ No heavy-handed lessons
- ❌ No confusing flashbacks (linear timeline only)

**Example Page:** "Emma tiptoed through the glistening garden, where dewdrops sparkled like tiny diamonds on every leaf."

#### Ages 5-6: "The Emergent Decoder" (Early Readers)

**Goal:** Building fluency and confidence

**Writing Rules:**
- ✅ Use sight words (the, and, it, was)
- ✅ Short, punchy sentences
- ✅ Clean text placement (not over busy illustrations)
- ❌ No slang or complex dialogue tags (stick to "said")
- ❌ No multi-syllabic words unless essential
- ❌ Never break a sentence across pages

**Example Page:** "Emma saw a frog. The frog was green. It said, 'Ribbit!'"

#### Ages 7-8: "The Independent Voyager" (Chapter Books)

**Goal:** Building stamina and mental picturing

**Writing Rules:**
- ✅ Focus on action-reaction (plot moves forward)
- ✅ Include humor (massive incentive for readers)
- ✅ Give protagonist agency (they solve problems, not adults)
- ❌ No dense internal monologue
- ❌ No chapters longer than 10 pages
- ❌ No introducing too many characters at once

**Example Page:** "Emma grabbed the rope and swung across the stream. Her heart pounded, but she landed safely on the other side. 'I did it!' she shouted."

#### Ages 9-12: "The Critical Thinker" (Middle Grade)

**Goal:** Exploration of complex themes and social dynamics

**Writing Rules:**
- ✅ Deal with real issues (friendships, family changes)
- ✅ Use literary devices (metaphors, foreshadowing)
- ✅ Authentic voice (sounds like a real kid, not adult's idea of one)
- ❌ No graphic violence or explicit romance
- ❌ No patronizing tone
- ❌ No excessive world-building over character development

**Example Page:** "Emma stared at the empty seat where Maya used to sit. Best friends since kindergarten, and now Maya wouldn't even look at her. What had she done wrong?"

---

## 4. Theme-Specific Guidelines

### 4.1 Adventure Theme 🏔️

**Core Elements:**
- Discovery and exploration
- Overcoming obstacles
- Bravery and courage
- Return home wiser

**Narrative Structure:**
- **Pages 1-2:** Ordinary world, hint of adventure
- **Page 3:** Call to adventure (discovery, invitation, challenge)
- **Pages 4-6:** Journey with obstacles and helpers
- **Pages 7-8:** Biggest challenge requiring courage
- **Pages 9-10:** Victory through cleverness or bravery
- **Pages 11-12:** Return home, share the adventure

**Example Story Beats:**
1. Emma loves exploring her backyard
2. She finds a mysterious map
3. The map leads to a hidden treehouse
4. She meets a friendly squirrel who needs help
5. They face a rickety bridge
6. The bridge seems too scary
7. Emma finds courage to cross
8. She helps the squirrel find his acorns
9. The squirrel shows her a secret path home
10. Emma returns with a new friend
11. She draws the adventure in her journal
12. Tomorrow, another adventure awaits!

### 4.2 Bedtime Theme 🌙

**Core Elements:**
- Calming progression
- Gentle transitions
- Peaceful resolution
- Soothing language

**Narrative Structure:**
- **Pages 1-2:** Evening begins, winding down
- **Pages 3-4:** Gentle activity (bath, pajamas, story)
- **Pages 5-6:** Quiet moments, soft observations
- **Pages 7-8:** Getting cozy, saying goodnight
- **Pages 9-10:** Drifting off, peaceful thoughts
- **Pages 11-12:** Sleep arrives, sweet dreams

**IMPORTANT:** No exciting elements, scary moments, or high energy. Everything trends toward calm.

**Example Story Beats:**
1. The sun paints the sky orange and pink
2. Emma waves goodbye to the day
3. Warm bath with rubber ducky
4. Soft pajamas, fluffy slippers
5. Brushing teeth, counting stars
6. Mama reads a story
7. Teddy bear gets tucked in first
8. Emma yawns, eyes getting heavy
9. Moonlight streams through the window
10. Whispered "I love you"
11. Dreams begin to dance
12. Peaceful sleep until morning

### 4.3 Learning Theme 📚

**Core Elements:**
- Clear educational objective
- Repetition for reinforcement
- Interactive elements
- Real-world connections

**Narrative Structure:**
- **Pages 1-2:** Introduction to learning topic through story
- **Pages 3-4:** First examples/discoveries
- **Pages 5-6:** More examples, pattern emerges
- **Pages 7-8:** Challenge or puzzle to solve
- **Pages 9-10:** Application of learning
- **Pages 11-12:** Celebration of knowledge, real-world connection

**Learning Topics by Age:**
- **0-2:** Colors, shapes, animals, sounds
- **3-4:** Numbers 1-10, letters, emotions, opposites
- **5-6:** Simple math, reading basics, nature
- **7-8:** Science concepts, geography, history
- **9-12:** Complex topics, critical thinking

**Example (Counting, Age 3-4):**
1. Emma goes to the farm
2. She sees 1 big red barn
3. 2 horses say hello
4. 3 pigs roll in mud
5. 4 chickens peck the ground
6. 5 sheep are fluffy and white
7. How many animals has Emma seen?
8. Let's count them all together!
9. Emma feeds all 15 animals
10. The farmer thanks Emma
11. Emma can count to 15 now!
12. What will she count tomorrow?

### 4.4 Fantasy Theme 🦄

**Core Elements:**
- Magical world-building
- Imaginative creatures
- Wonder and discovery
- Magic with rules/limits

**Narrative Structure:**
- **Pages 1-2:** Ordinary world with hint of magic
- **Page 3:** Portal/transformation to magical world
- **Pages 4-6:** Explore magical realm, meet magical beings
- **Pages 7-8:** Magical challenge or quest
- **Pages 9-10:** Use of magic to solve problem
- **Pages 11-12:** Return to ordinary world, magic remains in heart

**Example Story Beats:**
1. Emma finds a glowing stone in her pocket
2. The stone hums a gentle melody
3. She touches it and—whoosh!—she's in Cloudland
4. Everything floats: trees, houses, even puppies!
5. A cloud fairy named Pip needs help
6. The Rainbow Bridge is fading
7. Only a kind heart can restore it
8. Emma thinks of everyone she loves
9. The bridge glows bright again!
10. Pip gives Emma a cloud feather
11. Emma wakes up in her bed
12. But the cloud feather is real!

### 4.5 Animals Theme 🦁

**Core Elements:**
- Accurate animal behaviors (with personality)
- Natural habitats
- Animal friendships
- Respect for nature

**Narrative Structure:**
- **Pages 1-2:** Meet the animal in their habitat
- **Pages 3-4:** Animal's daily life and friends
- **Pages 5-6:** Challenge in the animal world
- **Pages 7-8:** Animal uses natural abilities
- **Pages 9-10:** Problem solved, community helped
- **Pages 11-12:** Peaceful ending in nature

**Example (Lion cub, Age 5):**
1. Leo the lion cub lives on the savanna
2. He loves playing with his sister Luna
3. Today, Leo wants to learn to roar
4. He tries: "Squeak!" Not quite right
5. He asks the elephant for help
6. "Breathe deep," says the elephant
7. Leo takes a BIG breath
8. "ROAR!" It echoes across the plains!
9. All the animals cheer for Leo
10. Even the birds clap their wings
11. Leo roars goodnight to the moon
12. Tomorrow, he'll teach Luna too

### 4.6 Custom Theme ✨

**Core Elements:**
- Follow user's story description closely
- Maintain age-appropriate guidelines
- Apply narrative arc framework
- Ensure safety rules still apply

**Prompt Handling:**
- Parse user's story description for key elements
- Map to closest theme structure as baseline
- Incorporate specific requests (characters, settings, events)
- Validate against safety rules

---

## 5. Content Safety Rules

### 5.1 Mandatory Exclusions

**Violence & Harm:**
- ❌ No violence, fighting, or weapons
- ❌ No physical harm or injury
- ❌ No death (of characters, pets, or family)
- ❌ No illness or medical emergencies
- ❌ No natural disasters causing harm

**Fear & Anxiety:**
- ❌ No scary monsters or nightmares
- ❌ No being lost or abandoned
- ❌ No separation from parents/caregivers
- ❌ No kidnapping or stranger danger scenarios
- ❌ No dark, threatening environments

**Inappropriate Content:**
- ❌ No stereotypes (gender, racial, cultural)
- ❌ No body shaming or appearance criticism
- ❌ No bullying (even if resolved)
- ❌ No romantic relationships (for ages 0-8)
- ❌ No bathroom humor or crude jokes

**External References:**
- ❌ No commercial brands or products
- ❌ No religious content or figures
- ❌ No political content or figures
- ❌ No real celebrities or public figures
- ❌ No copyrighted characters

**Digital & Modern Concerns:**
- ❌ No social media or internet references
- ❌ No screen time or device usage as plot points
- ❌ No online interactions or virtual worlds

### 5.2 Mandatory Inclusions

**Positive Values:**
- ✅ Kindness and empathy
- ✅ Friendship and cooperation
- ✅ Curiosity and learning
- ✅ Bravery (age-appropriate challenges)
- ✅ Problem-solving and creativity
- ✅ Family love and support
- ✅ Self-confidence and growth mindset
- ✅ Respect for nature and animals
- ✅ Inclusion and diversity

**Character Traits:**
- ✅ Main character is active protagonist
- ✅ Child solves problems (not rescued by adults)
- ✅ Emotions are acknowledged and validated
- ✅ Mistakes are learning opportunities
- ✅ Helping others is celebrated

### 5.3 Edge Case Handling

**Mild Challenges (Allowed):**
- ✅ Getting lost briefly (but finding way back)
- ✅ Feeling scared (but overcoming fear)
- ✅ Making mistakes (but learning from them)
- ✅ Disagreements with friends (resolved kindly)
- ✅ Missing someone (but reunion happens)

**Safety Flag Triggers:**
- ⚠️ Any mention of violence-related words
- ⚠️ Separation anxiety themes
- ⚠️ Negative self-talk by character
- ⚠️ Exclusion or rejection themes
- ⚠️ Any potentially scary imagery

### 5.4 Emotional Tone Requirements

**Primary Goal:** Every story should create a **joyful, memorable reading experience** for both children AND parents.

**Core Emotions to Evoke:**

| Emotion | For Children | For Parents |
|---------|--------------|-------------|
| **Fun** | Playful moments, silly surprises, humor | Enjoyable to read aloud, engaging |
| **Magic** | Wonder, enchantment, imagination | Nostalgia, sense of wonder |
| **Excitement** | Adventure, anticipation, discovery | Pride in child's engagement |
| **Delight** | Joy, happiness, satisfaction | Heartwarming moments |
| **Connection** | Seeing themselves in the story | Bonding with child, shared experience |

**Tone Guidelines by Theme:**

| Theme | Primary Tone | Secondary Emotions |
|-------|--------------|-------------------|
| **Adventure** | Exciting, empowering | Wonder, courage, triumph |
| **Bedtime** | Soothing, gentle | Comfort, safety, peace |
| **Learning** | Playful, encouraging | Curiosity, pride, accomplishment |
| **Fantasy** | Whimsical, magical | Wonder, imagination, delight |
| **Animals** | Warm, educational | Empathy, connection, respect |
| **Custom** | Match user intent | Positive, engaging, memorable |

**Writing for Dual Audience:**
- **Children:** Use playful language, sound effects, repetition, and surprises
- **Parents:** Include subtle humor, beautiful imagery, and heartfelt moments
- **Both:** Create "read it again!" appeal through engaging rhythm and satisfying endings

**Emotional Arc Requirements:**
1. **Opening:** Warm, inviting, establishes comfort
2. **Middle:** Building excitement, gentle tension, discovery
3. **Climax:** Thrilling but safe, empowering moment
4. **Resolution:** Satisfying, heartwarming, celebratory
5. **Ending:** Warm, encouraging, leaves reader feeling good

**Avoid:**
- ❌ Flat, boring, or monotonous tone
- ❌ Preachy or lecturing voice
- ❌ Overly serious or heavy themes
- ❌ Anxiety-inducing tension
- ❌ Sad or melancholic endings

---

## 6. Evaluation Framework

### 6.1 Story Quality Score (SQS) - Basic Framework

**Total: 10 points**

| Criterion | Points | Description |
|-----------|--------|-------------|
| **Age Appropriateness** | 2 | Vocabulary, concepts, text length match age |
| **Narrative Coherence** | 2 | Logical progression, clear arc, consistent plot |
| **Character Consistency** | 1 | Name, personality, description maintained |
| **Theme Adherence** | 1 | Story matches selected theme |
| **Language Quality** | 2 | Correct language, grammar, engaging vocabulary |
| **Safety Compliance** | 2 | No prohibited content, positive values present |

**Score Interpretation:**
- **9-10:** Excellent - Ready for production
- **7-8:** Good - Minor improvements possible
- **5-6:** Fair - Needs revision
- **<5:** Poor - Regeneration required

### 6.2 Enhanced SQS Framework (v2 - Stricter Criteria)

To better differentiate between prompt versions, we use an **Enhanced 20-point scale** with more granular criteria:

**Total: 20 points**

| Criterion | Points | Description | Scoring Guide |
|-----------|--------|-------------|---------------|
| **Age Appropriateness** | 0-3 | Word count, sentence length, concepts | 0=Wrong age, 1=Partially correct, 2=Mostly correct, 3=Perfect match |
| **Narrative Coherence** | 0-3 | Logical progression, clear arc | 0=Disjointed, 1=Basic structure, 2=Good flow, 3=Excellent arc |
| **Theme Alignment** | 0-2 | Story matches requested theme | 0=Off-theme, 1=Partially aligned, 2=Perfect alignment |
| **Safety Compliance** | 0-2 | No prohibited content | 0=Violation, 1=Minor concern, 2=Fully compliant |
| **Emotional Engagement** | 0-3 | Fun, magical, exciting, delightful | 0=Flat/boring, 1=Pleasant, 2=Engaging, 3=Delightful |
| **Sensory Richness** | 0-2 | Onomatopoeia, textures, vivid words | 0=Sparse, 1=Some detail, 2=Rich sensory language |
| **Participation Elements** | 0-2 | Interactive moments (ages 0-4) | 0=None, 1=1-2 moments, 2=3+ moments (N/A for 5+) |
| **Creative Framing** | 0-2 | Title, metaphors, unique angles | 0=Generic, 1=Adequate, 2=Creative/memorable |
| **Parent Appeal** | 0-1 | Enjoyable for adults to read aloud | 0=Tedious, 1=Enjoyable |

**Enhanced Score Interpretation:**
- **18-20:** Exceptional - Publication quality
- **15-17:** Excellent - Ready for production
- **12-14:** Good - Minor improvements possible
- **9-11:** Fair - Needs revision
- **<9:** Poor - Regeneration required

### 6.3 Subjective Evaluation Criteria

In addition to quantitative scoring, evaluate these subjective qualities:

| Criterion | Rating | Description |
|-----------|--------|-------------|
| **"Read Again" Factor** | Low/Medium/High | Would a child want to hear this story again? |
| **Emotional Authenticity** | Low/Medium/High | Do emotions feel real and validated? |
| **Character Voice** | Weak/Adequate/Strong | Does the protagonist feel alive and relatable? |
| **Memorable Moments** | 0/1-2/3+ | Count of standout phrases or scenes |
| **Coping Strategy Quality** | N/A/Weak/Strong | For challenging themes only |
| **Helper Character Effectiveness** | N/A/Weak/Strong | For fantasy/adventure only |

### 6.3a Image Prompt Quality Evaluation

Evaluate the quality of image prompts (imagePrompt field) for illustration generation:

**Image Prompt Score (IPS): 10 points**

| Criterion | Points | Description | Scoring Guide |
|-----------|--------|-------------|---------------|
| **Character Detail** | 0-2 | Physical description completeness | 0=Missing, 1=Basic, 2=Detailed (appearance, clothing, expression) |
| **Setting Specificity** | 0-2 | Environment and location detail | 0=Vague, 1=Basic location, 2=Rich environment (time, atmosphere, details) |
| **Action Clarity** | 0-2 | Clear description of what's happening | 0=Static/unclear, 1=Basic action, 2=Dynamic with movement |
| **Visual Details** | 0-2 | Colors, textures, objects, scale | 0=Generic, 1=Some details, 2=Rich sensory details |
| **Composition Guidance** | 0-1 | Focal point and spatial relationships | 0=Unclear, 1=Clear composition |
| **Consistency** | 0-1 | Matches character description and previous pages | 0=Inconsistent, 1=Consistent |

**Image Prompt Interpretation:**
- **9-10:** Excellent - Highly detailed, illustration-ready
- **7-8:** Good - Sufficient detail for quality illustration
- **5-6:** Fair - Needs more specificity
- **<5:** Poor - Too vague for consistent illustration

**Subjective Image Prompt Criteria:**

| Criterion | Rating | Description |
|-----------|--------|-------------|
| **Illustratability** | Low/Medium/High | How easy would this be to illustrate accurately? |
| **Visual Interest** | Low/Medium/High | Does the scene sound visually engaging? |
| **Age Appropriateness** | Poor/Good/Excellent | Visual complexity matches age group? |
| **Magical/Emotional Quality** | Weak/Adequate/Strong | Does it capture the story's emotional tone? |
| **Creativity** | Generic/Adequate/Unique | Original vs. clichéd visual descriptions? |

**Word Count Check:**
- Target: 40-100 words per imagePrompt
- <40 words: Too sparse, likely missing details
- 40-100 words: Optimal range
- >100 words: May be overly complex

**Mandatory Elements Checklist:**

For each imagePrompt, verify presence of:
- [ ] Character physical description (if character present)
- [ ] Character expression/emotion
- [ ] Setting/location details
- [ ] Time of day/lighting
- [ ] Action/movement description
- [ ] At least 3 specific visual details (colors, objects, textures)
- [ ] Composition/spatial information

**Consistency Checks:**

Across all pages in a story:
- [ ] Character appearance consistent (hair, eyes, clothing unless changed)
- [ ] Setting details build logically (if same location)
- [ ] Time progression makes sense (morning → afternoon → evening)
- [ ] Character clothing consistent unless story mentions change

### 6.4 Age-Specific Validation Checks

**Ages 0-2 (Board Books):**
| Check | Pass Criteria |
|-------|---------------|
| Words per page | 0-10 words |
| Sentence length | 1-5 words |
| Onomatopoeia count | ≥1 per page (12+ total) |
| Sensory words | ≥5 total |
| Participation moments | ≥3 total |

**Ages 3-4 (Picture Books):**
| Check | Pass Criteria |
|-------|---------------|
| Words per page | 10-50 words |
| Sentence length | 5-10 words |
| "Juicy" descriptive words | ≥8 total |
| Onomatopoeia | ≥6 total (1 per spread) |
| Participation moments | ≥3 total |
| Concrete details | All goals/ideas specific |

**Ages 5-6 (Early Readers):**
| Check | Pass Criteria |
|-------|---------------|
| Words per page | 5-40 words |
| Sentence length | 2-8 words |
| Vivid action words | ≥6 total |
| Sight words used | Appropriate frequency |
| No sentence breaks across pages | Pass/Fail |

**Ages 7-8 (Chapter Books):**
| Check | Pass Criteria |
|-------|---------------|
| Words per page | 50-150 words |
| Sentence length | 7-12 words |
| Humor elements | ≥2 funny moments |
| Protagonist agency | Solves problem themselves |
| Varied descriptive words | ≥10 total |

**Ages 9-12 (Middle Grade):**
| Check | Pass Criteria |
|-------|---------------|
| Words per page | 150-250 words |
| Sentence length | 10-20 words |
| Authentic kid voice | Not preachy/adult |
| Emotional depth | Shows, doesn't tell |
| Literary devices | ≥2 (metaphor, foreshadowing, etc.) |

### 6.5 Challenging Theme Evaluation

For stories involving fear, anxiety, jealousy, nervousness, or other challenging emotions:

| Check | Pass Criteria |
|-------|---------------|
| Emotion acknowledged | Character experiences feeling authentically |
| Emotion validated | Story shows feeling is okay/normal |
| Coping strategy present | Simple, memorable technique included |
| Strategy demonstrated | Character uses the strategy |
| Empowerment ending | Character feels better AND capable |

**Coping Strategy Examples:**
- "Superhero breath" (breathe in deep, out slow)
- "Count to three" (pause before reacting)
- "Hug your teddy" (comfort object)
- "Think of something happy" (redirect thoughts)
- "Ask for help" (it's okay to need support)

### 6.6 Comparative Evaluation Matrix

When comparing prompt versions (Original vs v1 vs v2), use this matrix:

| Story ID | Original (Basic SQS) | v1 (Basic SQS) | v1 (Enhanced SQS) | v2 (Enhanced SQS) | Winner |
|----------|---------------------|----------------|-------------------|-------------------|--------|
| T01 | /10 | /10 | /20 | /20 | |
| T02 | /10 | /10 | /20 | /20 | |
| ... | | | | | |

**Aggregate Metrics to Track:**
- Average score per prompt version
- Standard deviation (consistency)
- Perfect scores count
- Scores below threshold count
- Improvement delta between versions

### 6.7 Automated Validation Checks

**Pass/Fail Checks:**
- [ ] Language consistency (no mixed languages)
- [ ] Character name used correctly throughout
- [ ] Exactly 12 story pages generated
- [ ] JSON structure valid and complete
- [ ] No prohibited keywords detected
- [ ] Word count within age-appropriate range
- [ ] Sentence length within guidelines

### 6.8 Safety Scoring

**Safety Score: 10 points (must be 10/10)**

| Check | Points | Failure Condition |
|-------|--------|-------------------|
| No violence | 2 | Any violence-related content |
| No fear triggers | 2 | Scary/anxiety-inducing content |
| No inappropriate content | 2 | Stereotypes, body issues, etc. |
| No external references | 2 | Brands, religion, politics |
| Positive values present | 2 | Missing kindness, empathy, etc. |

**Flag Severity:**
- **Critical (Score 0-6):** Block generation, require manual review
- **Warning (Score 7-9):** Log for review, allow with flag
- **Pass (Score 10):** Approved for production

### 6.9 Database Logging

**Every story generation logs:**

```typescript
interface StoryEvaluation {
  // Identifiers
  storyId: string;
  userId: string;
  createdAt: timestamp;
  
  // Story Content
  storyContent: {
    title: string;
    pages: Array<{pageNumber: number; text: string; imagePrompt: string}>;
    backCoverBlurb: string;
    characterDescription: string;
  };
  
  // Input Parameters
  inputParams: {
    childName: string;
    childAge: number;
    bookType: string;
    bookTheme: string;
    storyDescription: string;
    language: string;
  };
  
  // Evaluation Scores
  evaluation: {
    qualityScore: number; // 0-10
    safetyScore: number; // 0-10
    ageAppropriatenessScore: number; // 0-2
    narrativeCoherenceScore: number; // 0-2
    characterConsistencyScore: number; // 0-1
    themeAdherenceScore: number; // 0-1
    languageQualityScore: number; // 0-2
  };
  
  // Validation Results
  validation: {
    languageCheckPassed: boolean;
    pageCountValid: boolean;
    jsonStructureValid: boolean;
    prohibitedContentDetected: boolean;
    wordCountInRange: boolean;
  };
  
  // Flags
  flags: {
    flaggedForReview: boolean;
    flagSeverity: 'none' | 'warning' | 'critical';
    flagReasons: string[];
  };
  
  // Metadata
  metadata: {
    promptVersion: string;
    modelUsed: string;
    generationTimeMs: number;
    tokenCount: number;
  };
}
```

**Retention:** 30 days

---

## 7. Implementation Phases

### Phase 1: Prompt Template Design (Week 1-2)

**Objective:** Design enhanced prompt template for English only

**Deliverables:**
1. Enhanced `getStoryPrompt()` template structure
2. Age-specific instruction modules
3. Theme-specific narrative guides
4. Safety rules integration
5. Output format specification

**NOT building:**
- No code changes
- No database changes
- No production deployment

### Phase 2: Local A/B Testing (Week 3-4)

**Objective:** Compare current vs. enhanced prompts locally

**Process:**
1. Define 20-30 story test cases (you will provide)
2. Generate user input variations for each
3. Generate stories using BOTH prompts:
   - Control: Current prompt
   - Test: Enhanced prompt
4. Evaluate all stories using SQS framework
5. Document results and comparisons

**Test Case Categories:**
- 5 stories per age group (0-3, 3-5, 5-7, 7-9, 9-12)
- 5 stories per theme (Adventure, Bedtime, Learning, Fantasy, Animals)
- 5 edge cases (Custom theme, unusual names, complex descriptions)

### Phase 3: Prompt Iteration (Week 5)

**Objective:** Improve prompt based on Phase 2 learnings

**Process:**
1. Analyze Phase 2 results
2. Identify failure patterns
3. Revise prompt template
4. Document changes and rationale

### Phase 4: Second A/B Test (Week 6)

**Objective:** Validate improvements

**Process:**
1. Regenerate same test cases with:
   - Original prompt (baseline)
   - Phase 2 prompt (v1)
   - Phase 3 prompt (v2)
2. Compare all three versions
3. Confirm improvement metrics
4. Final prompt selection

### Phase 5: Production Implementation (Week 7-8)

**Objective:** Deploy to production with full evaluation system

**Deliverables:**
1. Updated `lib/gemini/prompts/en.ts`
2. Evaluation service (`lib/validation/`)
3. Database schema for evaluations
4. Logging integration
5. Admin review interface (basic)

**Code Changes:**
- Story generation includes evaluation
- All evaluations logged to DB
- Critical flags trigger alerts

### Phase 6: Character Description Prompt Improvement (Week 9-10)

**Objective:** Enhance character extraction from photos for better consistency

**Current State:**
- Character extraction uses basic prompt: "Analyze this image and create a highly detailed character reference description"
- Results in generic descriptions that may miss key details
- No guidance on what makes a good character description for illustration consistency

**Improvements:**
1. **Enhanced Character Extraction Prompt:**
   - Add specific feature categories (facial structure, expressions, unique traits)
   - Request illustration-friendly descriptions (e.g., "round face with rosy cheeks" vs "circular facial structure")
   - Include age-appropriate appearance notes
   - Request clothing/accessory details for character consistency
   - Add guidance on avoiding ambiguous terms

2. **Testing Process:**
   - Test with 20 diverse child photos (different ages, ethnicities, features)
   - Compare original vs enhanced character descriptions
   - Generate 3 illustrations per character to test consistency
   - Evaluate: specificity, illustration consistency, age-appropriateness

3. **Success Metrics:**
   - Character descriptions are 50% more detailed (word count)
   - Illustration consistency score improves by 30%
   - 90%+ of descriptions include all key feature categories

**Deliverables:**
- Enhanced `getCharacterExtractionPrompt()` in `lib/gemini/prompts/en.ts`
- Character description quality evaluation framework
- Documentation of best practices for character descriptions

### Phase 7: Art Style Prompt Refinement (Week 11-12)

**Objective:** Optimize art style prompts for better illustration quality

**Current State:**
- 6 predefined art styles in `lib/art-styles.ts`
- Generic style descriptions (e.g., "classic children's book illustration style")
- No age-specific style variations
- No guidance on composition, lighting, or mood

**Improvements:**
1. **Enhanced Style Prompts:**
   - Add composition guidance (framing, perspective, focal points)
   - Include lighting/mood instructions appropriate for children's books
   - Add age-specific style variations (0-2: simpler, bolder; 9-12: more detailed)
   - Specify color palette guidance for each style
   - Add safety/appropriateness constraints per style

2. **New Style Categories:**
   - Age-optimized variants of existing styles
   - Theme-specific style recommendations
   - Emotional tone alignment (fun, magical, calming)

3. **Testing Process:**
   - Generate 10 illustrations per style with same scene
   - Test across all age groups
   - Evaluate: visual appeal, age-appropriateness, consistency, emotional tone
   - Parent/child feedback on style preferences

4. **Success Metrics:**
   - Illustration quality scores improve by 25%
   - Style consistency across pages improves by 40%
   - Parent satisfaction with visual quality increases by 30%

**Deliverables:**
- Enhanced art style definitions in `lib/art-styles.ts`
- Age-specific style variant system
- Style selection guidance documentation
- Updated `getIllustrationPrompt()` with enhanced style integration

---

## 8. Prompt Template Structure

### 8.1 Template Architecture

The enhanced prompt will follow this structure:

```
┌─────────────────────────────────────────────────────────────┐
│ SECTION 1: ROLE & CONTEXT                                   │
│ - Expert children's book author persona                     │
│ - Understanding of child development                        │
│ - Quality and safety commitment                             │
├─────────────────────────────────────────────────────────────┤
│ SECTION 2: INPUT PARAMETERS                                 │
│ - Child name, age                                           │
│ - Book type, theme                                          │
│ - Story description (user input)                            │
│ - Character description (if photo provided)                 │
├─────────────────────────────────────────────────────────────┤
│ SECTION 3: AGE-SPECIFIC GUIDELINES                          │
│ - Word count per page                                       │
│ - Sentence length                                           │
│ - Vocabulary level                                          │
│ - Dos and Don'ts for age group                              │
├─────────────────────────────────────────────────────────────┤
│ SECTION 4: THEME-SPECIFIC STRUCTURE                         │
│ - Narrative arc for 12 pages                                │
│ - Theme-appropriate elements                                │
│ - Example story beats                                       │
├─────────────────────────────────────────────────────────────┤
│ SECTION 5: CONTENT SAFETY RULES                             │
│ - Mandatory exclusions                                      │
│ - Mandatory inclusions                                      │
│ - Edge case guidance                                        │
├─────────────────────────────────────────────────────────────┤
│ SECTION 6: NARRATIVE REQUIREMENTS                           │
│ - 12 pages exactly                                          │
│ - Cover and back cover content                              │
│ - Character consistency                                     │
│ - Emotional arc                                             │
├─────────────────────────────────────────────────────────────┤
│ SECTION 7: OUTPUT FORMAT                                    │
│ - JSON structure specification                              │
│ - Required fields                                           │
│ - Image prompt guidelines                                   │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Dynamic Sections

The prompt will dynamically include relevant sections based on input:

**Always Included:**
- Role & Context
- Input Parameters
- Content Safety Rules
- Narrative Requirements
- Output Format

**Conditionally Included:**
- Age-specific guidelines (based on `childAge`)
- Theme-specific structure (based on `bookTheme`)
- Custom theme handling (if `bookTheme === 'custom'`)

### 8.3 Output JSON Structure

```json
{
  "title": "Emma's Garden Adventure",
  "backCoverBlurb": "Emma is a curious five-year-old who loves exploring her garden. Join her as she discovers that the best adventures are the ones shared with friends!",
  "characterDescription": "A curious 5-year-old girl with curly brown hair and bright green eyes, wearing her favorite yellow sundress",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Emma loved her garden more than anything in the whole wide world.",
      "imagePrompt": "A happy 5-year-old girl with curly brown hair standing in a colorful garden full of flowers, butterflies flying around her, morning sunlight, joyful expression"
    },
    // ... pages 2-12
  ]
}
```

---

## 9. Technical Requirements

### 9.1 No Changes to Current Architecture

Per decisions made:
- ✅ Keep current generation flow
- ✅ Keep current models
- ✅ Keep current rate limiting
- ✅ Keep current image generation

### 9.2 New Components (Phase 5 Only)

**Evaluation Service:**
```
lib/validation/
├── story-evaluator.ts    # Main evaluation logic
├── safety-checker.ts     # Safety rule validation
├── quality-scorer.ts     # SQS calculation
└── index.ts
```

**Database Schema Addition:**
```sql
CREATE TABLE story_evaluations (
  id UUID PRIMARY KEY,
  story_id UUID REFERENCES books(id),
  story_content JSONB,
  input_params JSONB,
  evaluation_scores JSONB,
  validation_results JSONB,
  flags JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for querying flagged stories
CREATE INDEX idx_flagged_stories ON story_evaluations 
  ((flags->>'flaggedForReview')) WHERE (flags->>'flaggedForReview') = 'true';

-- Auto-delete after 30 days
-- (Implement via cron job or Supabase function)
```

### 9.3 Optional Validation Prompt

If needed, we can add ONE additional prompt for validation:

**Purpose:** Post-generation quality check
**Model:** Same text model (`gemini-3-flash-preview`)
**When:** After story generation, before saving
**Cost:** ~10-20% increase in text model usage

**Decision:** Keep optional, implement only if automated checks insufficient.

---

## 10. Image Generation Notes

### 10.1 Current Status

Image generation prompts are **working well** and are **out of scope** for this PRD.

**Current Strengths:**
- ✅ Consistent character appearance
- ✅ Scene accuracy matches text
- ✅ Art style consistency
- ✅ Age-appropriate imagery

### 10.2 Potential Future Improvements (Not In Scope)

If we revisit image prompts in a future PRD, consider:

1. **Enhanced Character Consistency**
   - More detailed character reference in each prompt
   - Explicit clothing/accessory consistency

2. **Scene Composition**
   - Specify character position (left, center, right)
   - Indicate action vs. portrait shots
   - Background detail level guidance

3. **Emotional Expression**
   - Map story emotion to character expression
   - Ensure facial expressions match narrative

4. **Visual Continuity**
   - Reference previous scenes for setting consistency
   - Maintain time-of-day lighting

**Note:** These are observations only. No changes planned for this project.

---

## Appendix A: File References

| File | Purpose |
|------|---------|
| [prompt-breakdown.md](./prompt-breakdown.md) | Detailed breakdown of all prompts sent during generation |
| [word-sentence-length-age-groups.md](./word-sentence-length-age-groups.md) | Comprehensive age-specific writing guidelines |

---

## Appendix B: Approval & Next Steps

### Awaiting Approval

Please review this PRD and confirm:

1. ✅ Executive summary accurately reflects goals
2. ✅ Book structure (12 pages + cover + back) is correct
3. ✅ Age guidelines from reference doc are properly integrated
4. ✅ Theme structures have sufficient examples
5. ✅ Safety rules are comprehensive
6. ✅ Evaluation framework meets needs
7. ✅ Phased approach is acceptable
8. ✅ Technical requirements are clear

### Upon Approval

We will proceed with **Phase 1: Prompt Template Design**

**Phase 1 Deliverables:**
1. Complete prompt template structure (not code, just the template)
2. Age-specific instruction modules
3. Theme-specific narrative guides
4. Safety rules checklist
5. Output format specification

**You will provide:**
- Test story definitions for Phase 2
- Any additional edge cases to consider
- Feedback on template drafts

---

**Document Status:** Awaiting Approval  
**Last Updated:** February 1, 2026  
**Next Action:** Review and approve to begin Phase 1
