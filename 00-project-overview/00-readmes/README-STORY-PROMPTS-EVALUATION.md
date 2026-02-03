# Story Prompts Evaluation Framework

**Version:** 4.0  
**Updated:** February 3, 2026  
**Purpose:** Evaluation system for story creation prompt quality

---

## Overview

This framework evaluates children's story quality across four dimensions:

| Category | Score | Focus |
|----------|-------|-------|
| **TQS** | 10 pts | Text Quality - content, engagement, age-appropriateness |
| **IPS** | 10 pts | Image Prompt - detail, consistency, composition |
| **CIS** | 10 pts | Character & Illustration - description quality, cross-page consistency |
| **SMS** | 10 pts | Subjective Quality - fun, magic, emotional resonance |
| **TOTAL** | **40 pts** | Overall story quality |

---

## 1. Text Quality Score (TQS) - 10 Points

### 1.1 Age-Appropriateness (2 pts)

**Word Count Guidelines:**
| Age | Words/Page |
|-----|------------|
| 0-2 | 0-10 |
| 3-4 | 10-50 |
| 5-6 | 5-40 |
| 7-8 | 50-150 |
| 9-12 | 150-250 |

- **2 pts:** Perfect match for age (vocabulary, sentence length, concepts)
- **1 pt:** Some age-inappropriate elements
- **0 pts:** Wrong age level

### 1.2 Engagement Elements (2 pts)

**Mandatory by Age:**
- **0-2:** Onomatopoeia 1+/page, participation 3+/story, sensory words 5+
- **3-4:** Onomatopoeia 1-2/spread, participation 3+, descriptive words 8+
- **5-6:** Action words 6+, concrete details, coping strategies if challenging theme
- **7-8:** Descriptive words 10+, humor 2+, protagonist agency
- **9-12:** Show-don't-tell descriptors 10+, authentic voice, realistic coping

### 1.3 Emotional Arc (2 pts)

Story must include: Opening → Building → Climax → Resolution → Ending

### 1.4 Theme Integration (2 pts)

- Theme woven naturally, not preachy
- Protagonist demonstrates theme through actions
- Satisfying thematic resolution

### 1.5 Safety & Compliance (2 pts)

**Must Exclude:** Violence, scary content, death, abandonment, stereotypes, brands, religious/political content  
**Must Include:** Kindness, friendship, curiosity, problem-solving, creativity, family love, self-confidence

---

## 2. Image Prompt Score (IPS) - 10 Points

### 2.1 Character Detail (2 pts)
Physical appearance + clothing + expression + body language

### 2.2 Setting Specificity (2 pts)
Location + lighting + atmosphere + background elements

### 2.3 Action Clarity (2 pts)
What character is doing + dynamic elements + interaction with environment

### 2.4 Visual Details (2 pts)
Specific colors + textures + scale descriptors + named objects

### 2.5 Composition & Consistency (2 pts)
Focal point + spatial relationships + consistency across pages

**Word Count Requirement:** 60-100 words per image prompt

---

## 3. Character & Illustration Score (CIS) - 10 Points

### 3.1 Character Description Quality (5 pts)

| Element | Points | Requirement |
|---------|--------|-------------|
| Physical Identity | 2 | Age, hair (color/texture/quirks), eyes (color/shape), face shape, distinctive features |
| Emotional Baseline | 1 | Default expression, energy, how they carry themselves |
| Proportions | 1 | Age-appropriate body proportions, physical presence |
| Signature Styling | 1 | Core clothing colors/style, texture cues |

**Word Count Requirement:** 80-120 words for character description

### 3.2 Cross-Page Consistency (3 pts)

| Criterion | Points |
|-----------|--------|
| Character appearance same all pages | 1 |
| Clothing continuity (unless story changes it) | 1 |
| Secondary characters consistent when reappearing | 1 |

### 3.3 Visual Coherence (2 pts)

| Criterion | Points |
|-----------|--------|
| Environmental continuity (settings build logically) | 1 |
| Style/Ratio consistency maintained | 1 |

---

## 4. Subjective Quality Score (SMS) - 10 Points

| Criterion | Points | Consider |
|-----------|--------|----------|
| Fun Factor | 2 | Playful moments, humor, rhythm, surprises |
| Magic & Wonder | 2 | Enchantment, imagination, curiosity-inspiring |
| Read-Again Appeal | 2 | Satisfying arc, parent-friendly, not annoying on repeat |
| Emotional Resonance | 2 | Heartwarming, connection, positive feelings |
| Character Relatability | 2 | Child is hero, age-appropriate challenges, empowering |

---

## Score Interpretation

| Score | Rating | Interpretation |
|-------|--------|----------------|
| 36-40 | Excellent | Production ready |
| 32-35 | Very Good | Minor improvements |
| 27-31 | Good | Some enhancements needed |
| 20-26 | Average | Significant work required |
| <20 | Below Average | Major revision needed |

---

## Evaluation Template

```markdown
### Story: [Title]

**Metadata:** Age: [X], Theme: [X], Language: [X]

**TQS: [X]/10**
- Age-Appropriateness: [X]/2
- Engagement Elements: [X]/2
- Emotional Arc: [X]/2
- Theme Integration: [X]/2
- Safety Compliance: [X]/2

**IPS: [X]/10**
- Character Detail: [X]/2
- Setting Specificity: [X]/2
- Action Clarity: [X]/2
- Visual Details: [X]/2
- Composition & Consistency: [X]/2
- Word Count: [X] words

**CIS: [X]/10**
- Character Description Quality: [X]/5
- Cross-Page Consistency: [X]/3
- Visual Coherence: [X]/2

**SMS: [X]/10**
- Fun Factor: [X]/2
- Magic & Wonder: [X]/2
- Read-Again Appeal: [X]/2
- Emotional Resonance: [X]/2
- Character Relatability: [X]/2

**TOTAL: [X]/40**

**Strengths:** [Notes]
**Areas for Improvement:** [Notes]
```

---

## Test Coverage Requirements

**Age Distribution:** 0-2 (20%), 3-4 (40%), 5-6 (20%), 7-8 (10%), 9-12 (10%)

**Theme Distribution:** Bedtime, Learning, Social/Emotional, Adventure, Life Events, STEM/Nature

**Language Coverage:** English, German, Hebrew (minimum 5 stories each for multi-language testing)
