# PRD: Story Creation Prompt v4 - Implementation & Evaluation System

**Date:** February 2, 2026  
**Status:** Ready for Implementation  
**Owner:** Engineering Team  
**Related:** `prd-story-creation-prompt-improvement.md`, `prompt-new-v4.md`

---

## 1. Executive Summary

Following the successful development and evaluation of `prompt-new-v4.md` (93.5% quality score), this PRD outlines the implementation plan and ongoing evaluation system to ensure production story quality remains high.

### Goals
1. Implement `prompt-new-v4.md` as the production story generation prompt
2. Establish automated evaluation system for all generated stories
3. Monitor for quality regressions and edge cases
4. Create feedback loop for continuous improvement

---

## 2. Implementation Plan

### 2.1 Prompt Integration

#### Location
- **File:** `prompt-new-v4.md`
- **Integration Point:** Story generation service/API

#### Dynamic Sections
The prompt uses dynamic insertion based on user input:

```
[AGE-SPECIFIC SECTION]
↓ Insert based on child's age
- Ages 0-2: Baby/toddler guidelines
- Ages 3-4: Preschool guidelines
- Ages 5-6: Early elementary guidelines
- Ages 7-8: Elementary guidelines
- Ages 9-12: Pre-teen guidelines

[THEME-SPECIFIC SECTION]
↓ Insert based on story theme
- Adventure
- Bedtime
- Learning Milestone
- Fantasy
- Nature/Animals
- Custom (use request carefully)
```

#### Implementation Steps

1. **Parse User Input**
   - Extract: child age, theme, character description, story description
   - Validate: age range (0-12), theme type

2. **Build Prompt**
   ```python
   def build_story_prompt(age, theme, character, story_desc):
       base_prompt = load_base_prompt()  # Core requirements
       age_section = load_age_section(age)  # Age-specific guidelines
       theme_section = load_theme_section(theme)  # Theme-specific guidelines
       
       full_prompt = f"{base_prompt}\n{age_section}\n{theme_section}\n\nCHARACTER: {character}\nSTORY: {story_desc}"
       return full_prompt
   ```

3. **Send to LLM**
   - Model: GPT-4 or equivalent
   - Temperature: 0.7 (for creativity with consistency)
   - Max tokens: 2000 (for 12-page story + image prompts)

4. **Parse Response**
   - Extract: story text (12 pages), image prompts (12 prompts)
   - Validate: page count, image prompt count

---

## 3. Evaluation System

### 3.1 Automated Evaluation Metrics

All generated stories should be automatically evaluated using the following framework:

#### Text Quality Score (TQS) - 0-10

| Criterion | Check | Weight |
|-----------|-------|--------|
| **Word Count** | Age-appropriate (see guidelines) | 2 pts |
| **Onomatopoeia** | Present for ages 0-4 | 2 pts |
| **Participation** | Present for ages 0-4 | 2 pts |
| **Sensory Vocabulary** | Count matches age guidelines | 2 pts |
| **Coping Strategy** | Present for challenging themes | 1 pt |
| **Story Arc** | Beginning → Challenge → Resolution | 1 pt |

**Implementation:**
```python
def calculate_tqs(story, age, theme):
    score = 0
    
    # Word count check
    word_count = count_words(story)
    if is_age_appropriate_length(word_count, age):
        score += 2
    
    # Onomatopoeia check (ages 0-4)
    if age <= 4:
        if has_onomatopoeia(story):
            score += 2
    else:
        score += 2  # N/A for older ages
    
    # Participation check (ages 0-4)
    if age <= 4:
        if has_participation_prompts(story):
            score += 2
    else:
        score += 2  # N/A for older ages
    
    # Sensory vocabulary check
    sensory_count = count_sensory_words(story)
    if meets_sensory_threshold(sensory_count, age):
        score += 2
    
    # Coping strategy check
    if is_challenging_theme(theme):
        if has_coping_strategy(story):
            score += 1
    else:
        score += 1  # N/A for non-challenging themes
    
    # Story arc check
    if has_story_arc(story):
        score += 1
    
    return score
```

#### Image Prompt Score (IPS) - 0-10

| Criterion | Check | Weight |
|-----------|-------|--------|
| **Detail Level** | 40-100 words per prompt | 3 pts |
| **Character Consistency** | Same character description across pages | 3 pts |
| **No Visual Text** | No letters/words in prompt | 2 pts |
| **Atmosphere** | Matches story context | 2 pts |

**Implementation:**
```python
def calculate_ips(image_prompts, character_desc):
    score = 0
    
    # Detail level check
    avg_length = average_word_count(image_prompts)
    if 40 <= avg_length <= 100:
        score += 3
    elif 30 <= avg_length < 40 or 100 < avg_length <= 120:
        score += 2
    elif 20 <= avg_length < 30 or 120 < avg_length <= 150:
        score += 1
    
    # Character consistency check
    if all_prompts_have_character(image_prompts, character_desc):
        score += 3
    
    # No visual text check
    if no_text_in_prompts(image_prompts):
        score += 2
    
    # Atmosphere check (requires LLM)
    if atmosphere_matches_story(image_prompts, story):
        score += 2
    
    return score
```

#### Subjective Measure Score (SMS) - 0-10

This requires LLM-based evaluation:

```python
def calculate_sms(story, age, theme):
    evaluation_prompt = f"""
    Evaluate this children's story on a scale of 0-10 for:
    1. Emotional engagement (3 pts)
    2. Relatability for age {age} (3 pts)
    3. Overall "spark" and fun (2 pts)
    4. Logical grounding (2 pts)
    
    Story:
    {story}
    
    Provide scores and brief reasoning.
    """
    
    response = llm.evaluate(evaluation_prompt)
    return parse_sms_score(response)
```

#### Alignment with User Intent Score (AUS) - 0-10

| Criterion | Check | Weight |
|-----------|-------|--------|
| **Magic Appropriateness** | Requested vs. forced | 4 pts |
| **Helper Character** | Matches story world | 3 pts |
| **Theme Adherence** | Respects realistic vs. fantasy | 3 pts |

**Implementation:**
```python
def calculate_aus(story, user_input, theme):
    score = 0
    
    # Magic appropriateness check
    magic_requested = check_if_magic_requested(user_input)
    magic_present = detect_magic_in_story(story)
    
    if magic_requested and magic_present:
        score += 4  # Appropriate
    elif not magic_requested and not magic_present:
        score += 4  # Appropriate
    elif not magic_requested and magic_present:
        # Forced magic detected
        if is_fantasy_theme(theme):
            score += 2  # Acceptable for fantasy
        else:
            score += 0  # Inappropriate
    
    # Helper character check
    helper = detect_helper_character(story)
    if helper_matches_theme(helper, theme):
        score += 3
    
    # Theme adherence check
    if theme_is_respected(story, theme, user_input):
        score += 3
    
    return score
```

### 3.2 Evaluation Thresholds

| Metric | Minimum | Target | Alert If Below |
|--------|---------|--------|----------------|
| TQS | 7/10 | 9/10 | 7 |
| IPS | 7/10 | 9/10 | 7 |
| SMS | 7/10 | 9/10 | 7 |
| AUS | 8/10 | 10/10 | 8 |
| **Total** | **29/40** | **37/40** | **29** |
| **Percentage** | **72.5%** | **92.5%** | **72.5%** |

### 3.3 Monitoring & Alerts

#### Real-Time Monitoring
- Evaluate every generated story
- Log scores to database
- Alert if any story scores below threshold

#### Daily Reports
- Average scores across all stories
- Distribution of scores
- Flagged stories (below threshold)
- Common issues detected

#### Weekly Analysis
- Trend analysis (improving/declining)
- Theme-specific performance
- Age-specific performance
- Edge case identification

---

## 4. Quality Assurance Checklist

### Pre-Generation Validation
- [ ] User input parsed correctly
- [ ] Age is valid (0-12)
- [ ] Theme is recognized
- [ ] Character description is present
- [ ] Story description is present

### Post-Generation Validation
- [ ] Story has 12 pages
- [ ] Each page has text
- [ ] 12 image prompts generated
- [ ] No visual text in image prompts
- [ ] Character name is consistent
- [ ] TQS ≥ 7/10
- [ ] IPS ≥ 7/10
- [ ] SMS ≥ 7/10
- [ ] AUS ≥ 8/10
- [ ] Total ≥ 29/40 (72.5%)

### Forced Magic Detection
For realistic themes (non-fantasy), check for:
- [ ] No glowing objects (unless requested)
- [ ] No supernatural powers (unless requested)
- [ ] No magical creatures (unless requested)
- [ ] Helper character is realistic (parent, friend, coach, animal with personality)

---

## 5. Edge Cases & Handling

### 5.1 Detected Edge Cases from Testing

| Edge Case | Detection | Handling |
|-----------|-----------|----------|
| **Metaphorical Glow** | "soft glow" in emotions story | ✅ Acceptable if metaphorical |
| **Animal Helpers** | Talking animals in realistic safari | ✅ Acceptable if personality, not magic |
| **Tech Helpers** | Robots in STEM stories | ✅ Acceptable if child's invention |
| **Fantasy Bleed** | Magic in realistic theme | ❌ Regenerate with stricter guidance |

### 5.2 Regeneration Triggers

Automatically regenerate if:
- Total score < 29/40 (72.5%)
- AUS < 6/10 (forced magic detected)
- Missing mandatory elements (onomatopoeia for ages 0-4)
- Visual text detected in image prompts

---

## 6. Feedback Loop

### 6.1 User Feedback Collection
- Star rating (1-5) after story generation
- Optional comment field
- "Report issue" button for specific problems

### 6.2 Human Review Queue
Stories flagged for human review if:
- Automated score < 29/40
- User rating < 3 stars
- User reports issue
- Edge case detected

### 6.3 Continuous Improvement
- Monthly review of flagged stories
- Identify new patterns of forced magic
- Update prompt if systematic issues found
- Update evaluation criteria if needed

---

## 7. Implementation Timeline

### Phase 1: Core Implementation (Week 1)
- [ ] Integrate `prompt-new-v4.md` into story generation service
- [ ] Implement dynamic section insertion
- [ ] Deploy to staging environment
- [ ] Test with 30 reference stories

### Phase 2: Evaluation System (Week 2)
- [ ] Implement TQS calculation
- [ ] Implement IPS calculation
- [ ] Implement SMS calculation (LLM-based)
- [ ] Implement AUS calculation
- [ ] Set up database logging

### Phase 3: Monitoring & Alerts (Week 3)
- [ ] Set up real-time monitoring dashboard
- [ ] Configure alert thresholds
- [ ] Implement daily report generation
- [ ] Set up human review queue

### Phase 4: Production Rollout (Week 4)
- [ ] Deploy to production
- [ ] Monitor first 100 stories closely
- [ ] Collect user feedback
- [ ] Adjust thresholds if needed

---

## 8. Success Metrics

### Launch Criteria
- [ ] All 30 reference stories score ≥ 29/40
- [ ] No forced magic in realistic themes
- [ ] All mandatory elements present
- [ ] Staging tests pass

### Post-Launch Metrics (First Month)
- **Target:** 90%+ of stories score ≥ 29/40
- **Target:** 95%+ of stories have no forced magic
- **Target:** User satisfaction ≥ 4.0/5.0 stars
- **Target:** < 5% regeneration rate

---

## 9. Rollback Plan

If production quality drops below acceptable levels:

1. **Immediate Actions**
   - Revert to previous prompt version
   - Investigate root cause
   - Review flagged stories

2. **Root Cause Analysis**
   - Check for LLM model changes
   - Review recent user inputs for new patterns
   - Analyze evaluation scores for systematic issues

3. **Fix & Redeploy**
   - Update prompt if needed
   - Test with 30 stories
   - Gradual rollout (10% → 50% → 100%)

---

## 10. Appendix: Evaluation Code Examples

### 10.1 Word Count Guidelines

```python
WORD_COUNT_GUIDELINES = {
    (0, 2): (50, 100),      # Ages 0-2: 50-100 words
    (3, 4): (100, 200),     # Ages 3-4: 100-200 words
    (5, 6): (200, 400),     # Ages 5-6: 200-400 words
    (7, 8): (400, 600),     # Ages 7-8: 400-600 words
    (9, 12): (600, 1000),   # Ages 9-12: 600-1000 words
}

def is_age_appropriate_length(word_count, age):
    for (min_age, max_age), (min_words, max_words) in WORD_COUNT_GUIDELINES.items():
        if min_age <= age <= max_age:
            return min_words <= word_count <= max_words
    return False
```

### 10.2 Sensory Vocabulary Detection

```python
SENSORY_WORDS = {
    'sight': ['sparkly', 'glistening', 'shimmering', 'bright', 'colorful', ...],
    'sound': ['whoosh', 'splash', 'crunch', 'moo', 'roar', ...],
    'touch': ['fuzzy', 'soft', 'bumpy', 'smooth', 'squishy', ...],
    'smell': ['sweet', 'fresh', 'flowery', ...],
    'taste': ['yummy', 'sweet', 'sour', ...],
}

def count_sensory_words(story):
    count = 0
    story_lower = story.lower()
    for category, words in SENSORY_WORDS.items():
        for word in words:
            count += story_lower.count(word)
    return count

def meets_sensory_threshold(count, age):
    thresholds = {
        (0, 2): 5,
        (3, 4): 8,
        (5, 6): 10,
        (7, 8): 12,
        (9, 12): 15,
    }
    for (min_age, max_age), threshold in thresholds.items():
        if min_age <= age <= max_age:
            return count >= threshold
    return False
```

### 10.3 Magic Detection

```python
MAGIC_KEYWORDS = [
    'glowing', 'magical', 'sparkles', 'enchanted', 'spell',
    'portal', 'fairy', 'wizard', 'supernatural', 'mystical',
    'shimmering light', 'golden glow', 'silver shimmer',
]

def detect_magic_in_story(story):
    story_lower = story.lower()
    for keyword in MAGIC_KEYWORDS:
        if keyword in story_lower:
            return True
    return False

def check_if_magic_requested(user_input):
    magic_themes = ['fantasy', 'unicorn', 'dragon', 'fairy', 'wizard', 'superhero', 'time travel', 'tooth fairy']
    user_input_lower = user_input.lower()
    for theme in magic_themes:
        if theme in user_input_lower:
            return True
    return False
```

---

## 11. Consolidated Evaluation Points

### From All Testing Phases

1. **Text Quality (TQS)**
   - ✅ Age-appropriate word count
   - ✅ Onomatopoeia for ages 0-4
   - ✅ Participation elements for ages 0-4
   - ✅ Sensory vocabulary count
   - ✅ Coping strategies for challenging themes
   - ✅ Clear story arc (beginning → challenge → resolution)

2. **Image Prompts (IPS)**
   - ✅ 40-100 words per prompt
   - ✅ Character consistency across all 12 prompts
   - ✅ No visual text/letters
   - ✅ Atmosphere matches story context
   - ✅ Age-appropriate complexity

3. **Subjective Quality (SMS)**
   - ✅ Emotional engagement
   - ✅ Relatability for target age
   - ✅ Overall "spark" and fun
   - ✅ Logical grounding (no jarring elements)

4. **User Intent Alignment (AUS)**
   - ✅ Magic only when requested or appropriate
   - ✅ Helper character matches story world
   - ✅ Respects realistic vs. fantasy context
   - ✅ Child solves problem (helper supports, doesn't solve)

5. **Safety & Appropriateness**
   - ✅ No scary/violent content
   - ✅ Positive messages
   - ✅ Age-appropriate themes
   - ✅ Inclusive and diverse

6. **Technical Requirements**
   - ✅ Exactly 12 pages
   - ✅ Exactly 12 image prompts
   - ✅ Consistent character name
   - ✅ No formatting errors

---

*End of PRD*
