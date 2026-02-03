


Here are the specific character attributes that were explicitly defined in the prompt—isolated from style, medium, or background:

Physical attributes
	•	Age: toddler (roughly 2–3 years old)
	•	Hair: light blond, slightly curly, soft texture, gentle wisps framing the forehead
	•	Eyes: bright blue
	•	Face: rounded proportions, soft features
	•	Teeth: small baby teeth visible
	•	Skin cues: implied softness/youthfulness (not explicitly tonal or ethnic)

Expression & emotion
	•	Facial expression: wide, open smile
	•	Emotional state: joyful, warm, innocent
	•	Mood conveyed: spontaneous happiness, calm joy

Clothing & appearance
	•	Top: vivid red, short-sleeve shirt
	•	Outerwear: classic blue denim overalls
	•	Details: subtle stitching, metal fasteners
	•	Overall look: age-appropriate, natural, unforced

Proportions & posture
	•	Body proportions: realistic toddler proportions (not stylized or exaggerated)
	•	Presence: relaxed, open, childlike stance (implicitly front-facing)

Identity boundaries (important but implicit)
	•	No name
	•	No personal identity
	•	No real-world reference
	•	No gendered framing beyond visual cues

In short: the character definition focused on age, physical markers, expression, clothing, and emotional tone, while deliberately avoiding anything that would imply identity, narrative backstory, or specificity beyond what’s needed for visual recognition and emotional clarity.
⸻

a) Elements / attributes / themes to consider when extracting a character

(with the explicit goal of keeping them as close to their origin as possible)

Think in layers, from most identity-critical → most flexible.

1. Core physical identity (non-negotiable)

These are the anchors. If these drift, the character stops feeling like the same character.
	•	Age range / life stage (e.g. toddler, not “young child”)
	•	Hair: color, texture, length, defining quirks (e.g. wispy curls, cowlicks)
	•	Eyes: color, size impression (bright, wide, soft)
	•	Face shape: round vs angular, softness vs definition
	•	Signature facial feature (e.g. baby teeth when smiling)

2. Emotional baseline (identity through feeling)

This matters as much as appearance.
	•	Default emotional tone (joyful, curious, calm, mischievous, serious)
	•	How emotion is expressed (open smile vs subtle grin)
	•	Emotional temperature (gentle, energetic, serene)

3. Proportions & presence

Often overlooked, but critical.
	•	Body proportions appropriate to age
	•	Head-to-body ratio
	•	Overall physical “presence” (soft, light, grounded, bouncy)

4. Signature styling (semi-flexible)

These can adapt, but should echo the original.
	•	Core color identity (e.g. red + blue)
	•	Clothing type more than exact outfit (playful, practical, classic)
	•	Texture cues (denim, cotton, softness)

5. Character energy & personality cues

This is what lets the character live across stories.
	•	Personality adjectives (e.g. joyful, open, gentle, curious)
	•	Social energy (inviting, playful, calm observer)
	•	World relationship (at ease in nature, friendly with animals, etc.)

6. Explicit exclusions (guardrails)

Just as important as inclusions.
	•	What the character is not
	•	Styles to avoid (hyperrealistic, edgy, sarcastic, adult-coded)
	•	Emotional tones that break character (melancholic, ironic, aggressive)

⸻

b) The prompt for extracting the character

(designed to be reused as a “character lock” in future prompts)

This is written as a neutral character extraction, not tied to any one scene or style.

Character extraction prompt:

Extract and describe a recurring illustrated character based on the reference image.

The character is a joyful toddler, approximately 2–3 years old, with light blond, slightly curly hair featuring soft wisps around the forehead. The child has bright blue eyes, a rounded face, soft cheeks, and a wide, open smile that often shows small baby teeth. The overall appearance is gentle, youthful, and warm.

The character’s default expression conveys openness, happiness, and innocent curiosity. Their emotional baseline is cheerful and calm rather than hyperactive.

Proportions are clearly toddler-like, with a relatively large head, soft limbs, and natural, age-appropriate posture.

Visually, the character is most often associated with playful, classic children’s clothing—most notably a red top and blue denim-style garments—though outfits may vary as long as they remain age-appropriate, soft, and storybook-friendly.

The character’s personality reads as friendly, safe, and approachable, fitting naturally into whimsical, fairytale, or children’s book environments.

Avoid aging the character up, introducing sharp or angular features, dark or moody emotions, hyperrealistic rendering, or adult-coded styling. The character should always feel tender, joyful, and suitable for a children’s picture book.

This prompt becomes your character reference block. You prepend it to any future image prompt.

⸻

c) Example of a final extract with the added picture

(how you would actually use this in practice)

Structure you’d reuse every time:

Reference character:
[Insert the full character extraction prompt above]

New scene prompt:
Illustrate this character in a rainy-day kitchen scene, baking cookies with a wooden spoon, surrounded by warm light and soft pastel tones, maintaining a whimsical children’s book watercolor style.

Or:

Reference character:
[Character extraction prompt]

New scene prompt:
Depict the character riding a snail through a moonlit fairytale forest, fireflies glowing, with gentle storybook textures and playful imagination.

⸻

Key takeaway

What you’ve done—without explicitly naming it—is create a portable character identity.
The success comes from:
	•	Locking who the character is
	•	Letting where and how they exist remain flexible

If you want, next we can:
	•	Turn this into a short “character token” (ultra-compact, model-friendly)
	•	Create a JSON-style character schema for production pipelines
	•	Stress-test the character by placing them in extreme scenarios (night, winter, fantasy, space) while preserving identity

    

model 2:

When "extracting" a character for consistent recreation across different AI-generated scenes, the goal is to define their **visual DNA**. You want to describe them in a way that separates the person from the specific lighting or setting of the original photo.

Here is how I would approach extracting the woman from your provided image:

---

### A) Elements, Attributes, and Themes for Character Extraction

To keep a character consistent, you should focus on these "anchor points":

* **Geometric Anchors:** Focus on the shape of the eyes (e.g., almond, hooded), the bridge of the nose, and the structure of the jaw and forehead. These remain the same regardless of the "style" of the art.
* **Color Constants:** Specifically define the eye color and the multi-tonal nature of the hair (e.g., "honey blonde with light brown lowlights") rather than just a single color.
* **The "Micro-Features":** Small details like a specific beauty mark, the way the eyes crinkle when smiling, or a particular tooth alignment are the "fingerprints" that make a character recognizable.
* **Energy & Expression:** Every person has a "default" energy. Is it serene, bubbly, intense, or warm? Capturing this ensures the character *feels* like the same person even in different poses.

---

### B) The Extraction Prompt

If I were to ask a system to "scan" this image for the purpose of recreating her, I would use this prompt:

> "Perform a character study of the woman in **image_c2ecad.jpg**. Describe her unique facial architecture, including eye shape and exact color, the curve of her smile, and the specific placement of any beauty marks. Detail her hair texture, length, and the blend of colors within it. Focus purely on her physical identity and emotional 'vibe' to create a portable character description that can be used in different settings and artistic mediums."

---

### C) The Final Character Extract

Based on the image provided, here is the "Character Model" description I would use to recreate her in other prompts:

**Subject Description:**

* **Facial Features:** Striking, clear light blue eyes with a friendly, open expression. She has a wide, genuine smile showing her upper teeth, and a small, distinct beauty mark centered on her chin.
* **Hair:** Long, straight hair with a fine texture, featuring a natural blend of light brown and golden blonde tones, styled with a side part and tucked behind the ears.
* **Structure:** A high, smooth forehead, soft cheekbones, and a gentle, rounded jawline.
* **Persona:** She carries a warm, approachable, and calm energy.
* **Core Palette:** Cool-toned skin, bright blue eyes, and warm-blonde hair.

---



To capture the essence of the child (or "character") in the prompt, I focused on three specific areas to ensure the AI maintained the likeness and energy of the original photo.

Here are the attributes I prioritized:

* **Emotional Expression:** I described the child as **"joyful"** and specified a **"smiling face with visible teeth."** This was key to ensuring the illustration captured the specific, high-energy laughter seen in the photo rather than just a generic smile.
* **Distinct Physical Features:** I highlighted the **"curly blonde hair."** In watercolor, "curly" is an important instruction because it tells the AI to use rounded, overlapping brushstrokes rather than long, straight washes of color.
* **Specific Attire:** I detailed the **"blue denim overalls over the red t-shirt."** This wasn't just for accuracy; the primary colors (red and blue) provide a strong visual contrast that works exceptionally well with the vibrant, bleeding nature of watercolor paints.

---

By focusing on these specific physical and emotional markers, the goal was to create a piece that felt like a "portrait" rather than just a generic illustration of a child.

