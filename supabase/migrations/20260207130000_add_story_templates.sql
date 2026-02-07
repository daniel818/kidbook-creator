-- ============================================
-- Story Templates Table for "Our Books" Library
-- ============================================

CREATE TABLE IF NOT EXISTS story_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,

  -- Content (i18n via JSONB)
  title JSONB NOT NULL,                -- {"en": "...", "de": "...", "he": "..."}
  description JSONB,                   -- {"en": "...", "de": "...", "he": "..."}
  highlights JSONB,                    -- {"en": ["...", "..."], "de": [...], "he": [...]}

  -- Media
  cover_image_url TEXT,                -- Supabase Storage public URL
  sample_pages TEXT[] DEFAULT '{}',    -- Array of image URLs

  -- Classification
  audience TEXT NOT NULL CHECK (audience IN ('baby', 'preschool', 'early_reader', 'older_kids', 'adults')),
  age_min INT,
  age_max INT,
  category TEXT NOT NULL CHECK (category IN (
    'bedtime', 'adventure', 'fantasy', 'animals', 'family',
    'holidays', 'milestones', 'educational', 'emotions', 'humor',
    'romance', 'careers', 'sports', 'cultural'
  )),
  tags TEXT[] DEFAULT '{}',

  -- Book metadata
  page_count INT DEFAULT 12,
  art_style TEXT,

  -- Curation
  popularity_score INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_templates_audience ON story_templates(audience) WHERE status = 'published';
CREATE INDEX idx_templates_category ON story_templates(category) WHERE status = 'published';
CREATE INDEX idx_templates_popularity ON story_templates(popularity_score DESC) WHERE status = 'published';
CREATE INDEX idx_templates_slug ON story_templates(slug);
CREATE INDEX idx_templates_featured ON story_templates(is_featured) WHERE status = 'published' AND is_featured = true;
CREATE INDEX idx_templates_created ON story_templates(created_at DESC) WHERE status = 'published';

-- RLS: public read, no public write
ALTER TABLE story_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published templates"
  ON story_templates FOR SELECT
  USING (status = 'published');

-- Updated at trigger (reuses existing function)
CREATE TRIGGER update_story_templates_updated_at
  BEFORE UPDATE ON story_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Storage bucket for template covers
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'template-covers',
  'template-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Public read access for template covers
CREATE POLICY "Public read template covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'template-covers');

-- ============================================
-- Seed P1 templates (10 initial)
-- ============================================
INSERT INTO story_templates (slug, title, description, highlights, audience, age_min, age_max, category, tags, page_count, art_style, popularity_score, is_featured, is_new, status) VALUES

-- Baby & Toddler
('goodnight-name', 
 '{"en": "Goodnight, [Name]", "de": "Gute Nacht, [Name]", "he": "לילה טוב, [Name]"}',
 '{"en": "A soothing bedtime story where the stars, moon, and gentle animals all whisper goodnight to your little one by name. Perfect for winding down before sleep.", "de": "Eine beruhigende Gutenachtgeschichte, in der Sterne, Mond und sanfte Tiere Ihrem Kleinen beim Namen eine gute Nacht wünschen.", "he": "סיפור שינה מרגיע בו הכוכבים, הירח וחיות עדינות לוחשים לילה טוב לילד שלכם בשמו."}',
 '{"en": ["Calming bedtime routine", "Beautiful night-sky illustrations", "Personalized with your child''s name"], "de": ["Beruhigende Schlafenszeit-Routine", "Wunderschöne Nachthimmel-Illustrationen", "Personalisiert mit dem Namen Ihres Kindes"], "he": ["שגרת שינה מרגיעה", "איורים יפים של שמי לילה", "מותאם אישית עם שם הילד שלכם"]}',
 'baby', 0, 2, 'bedtime', ARRAY['bedtime', 'family'], 12, 'watercolor', 95, true, false, 'published'),

('name-animal-sounds',
 '{"en": "[Name]''s Animal Sounds", "de": "[Name]s Tiergeräusche", "he": "צלילי החיות של [Name]"}',
 '{"en": "Join [Name] on a farm adventure discovering what each animal says! From mooing cows to quacking ducks, every page brings a new sound to learn.", "de": "Begleite [Name] auf ein Bauernhof-Abenteuer und entdecke, was jedes Tier sagt!", "he": "הצטרפו ל[Name] להרפתקה בחווה לגלות מה כל חיה אומרת!"}',
 '{"en": ["Interactive animal sounds", "Builds early vocabulary", "Colorful farm illustrations"], "de": ["Interaktive Tiergeräusche", "Baut frühes Vokabular auf", "Farbenfrohe Bauernhof-Illustrationen"], "he": ["צלילי חיות אינטראקטיביים", "בונה אוצר מילים מוקדם", "איורים צבעוניים של חווה"]}',
 'baby', 0, 2, 'animals', ARRAY['animals', 'educational'], 12, 'cartoon', 90, true, false, 'published'),

-- Preschool
('name-magical-unicorn',
 '{"en": "[Name]''s Magical Unicorn", "de": "[Name]s magisches Einhorn", "he": "חד הקרן הקסום של [Name]"}',
 '{"en": "When [Name] discovers a magical unicorn in the garden, an enchanting adventure begins through rainbow valleys and sparkling waterfalls. A story about friendship and believing in magic.", "de": "Als [Name] ein magisches Einhorn im Garten entdeckt, beginnt ein zauberhaftes Abenteuer durch Regenbogentäler und glitzernde Wasserfälle.", "he": "כש[Name] מגלה חד קרן קסום בגינה, מתחיל הרפתקה מרהיבה דרך עמקי קשת וזוהר."}',
 '{"en": ["Sparkling fantasy adventure", "Teaches friendship and kindness", "Dreamy watercolor illustrations"], "de": ["Funkelndes Fantasy-Abenteuer", "Lehrt Freundschaft und Freundlichkeit", "Verträumte Aquarell-Illustrationen"], "he": ["הרפתקת פנטזיה נוצצת", "מלמד חברות וטוב לב", "איורים חלומיים בצבעי מים"]}',
 'preschool', 3, 4, 'fantasy', ARRAY['fantasy'], 12, 'watercolor', 92, true, false, 'published'),

('bye-bye-pacifier',
 '{"en": "Bye Bye Pacifier, [Name]!", "de": "Tschüss Schnuller, [Name]!", "he": "ביי ביי מוצץ, [Name]!"}',
 '{"en": "[Name] is growing up and it''s time to say goodbye to the pacifier! Join [Name] on a brave journey of letting go and discovering that big-kid adventures are even more fun.", "de": "[Name] wird groß und es ist Zeit, sich vom Schnuller zu verabschieden!", "he": "[Name] גדל/ה והגיע הזמן להיפרד מהמוצץ! הצטרפו ל[Name] למסע אמיץ של ויתור."}',
 '{"en": ["Helps with pacifier weaning", "Celebrates growing up", "Encouraging and positive tone"], "de": ["Hilft beim Schnuller-Entwöhnung", "Feiert das Großwerden", "Ermutigender und positiver Ton"], "he": ["עוזר בגמילה מהמוצץ", "חוגג גדילה", "טון מעודד וחיובי"]}',
 'preschool', 3, 4, 'milestones', ARRAY['milestones'], 12, 'cartoon', 88, true, false, 'published'),

('name-first-day-school',
 '{"en": "[Name]''s First Day of School", "de": "[Name]s erster Schultag", "he": "היום הראשון של [Name] בבית הספר"}',
 '{"en": "It''s the big day! [Name] is starting school and feeling a mix of excitement and butterflies. Follow along as [Name] makes new friends, explores the classroom, and discovers that school is wonderful.", "de": "Es ist der große Tag! [Name] kommt in die Schule und fühlt eine Mischung aus Aufregung und Schmetterlingen im Bauch.", "he": "הגיע היום הגדול! [Name] מתחיל/ה בבית הספר ומרגיש/ה תמהיל של התרגשות ופרפרים בבטן."}',
 '{"en": ["Eases first-day anxiety", "Celebrates new beginnings", "Relatable school-day scenes"], "de": ["Lindert Ersttagsangst", "Feiert Neuanfänge", "Nachvollziehbare Schultagszenen"], "he": ["מרגיע חרדת יום ראשון", "חוגג התחלות חדשות", "סצנות בית ספר מוכרות"]}',
 'preschool', 3, 4, 'milestones', ARRAY['milestones', 'emotions'], 12, 'cartoon', 91, true, false, 'published'),

-- Early Reader
('name-the-firefighter',
 '{"en": "[Name] the Firefighter", "de": "[Name] die Feuerwehr", "he": "[Name] הכבאי/ת"}',
 '{"en": "When the alarm rings, [Name] jumps into action! Suit up, slide down the pole, and race to save the day. An action-packed adventure about bravery and helping others.", "de": "Wenn der Alarm klingelt, springt [Name] in Aktion! Anzug an, die Stange runter und los zum Einsatz.", "he": "כשהאזעקה מצלצלת, [Name] קופץ/ת לפעולה! להתלבש, להחליק על המוט, ולרוץ להציל את היום."}',
 '{"en": ["Action-packed career exploration", "Teaches bravery and teamwork", "Exciting fire truck illustrations"], "de": ["Actionreiche Berufserkundung", "Lehrt Tapferkeit und Teamarbeit", "Aufregende Feuerwehrauto-Illustrationen"], "he": ["חקירת קריירה מלאת אקשן", "מלמד אומץ ועבודת צוות", "איורים מרגשים של כבאיות"]}',
 'early_reader', 5, 6, 'careers', ARRAY['careers', 'adventure'], 12, 'cartoon', 87, true, false, 'published'),

('name-secret-mission',
 '{"en": "[Name]''s Secret Mission", "de": "[Name]s geheime Mission", "he": "המשימה הסודית של [Name]"}',
 '{"en": "[Name] receives a mysterious letter with a coded message. Follow the clues through hidden passages, solve puzzles, and uncover a wonderful surprise at the end!", "de": "[Name] erhält einen geheimnisvollen Brief mit einer codierten Nachricht. Folge den Hinweisen durch versteckte Gänge.", "he": "[Name] מקבל/ת מכתב מסתורי עם הודעה מוצפנת. עקבו אחרי הרמזים דרך מעברים נסתרים."}',
 '{"en": ["Exciting puzzle adventure", "Builds problem-solving skills", "Interactive clue-following story"], "de": ["Spannendes Rätsel-Abenteuer", "Fördert Problemlösungsfähigkeiten", "Interaktive Hinweis-Geschichte"], "he": ["הרפתקת חידות מרגשת", "בונה כישורי פתרון בעיות", "סיפור אינטראקטיבי"]}',
 'early_reader', 5, 6, 'adventure', ARRAY['adventure'], 12, 'cartoon', 85, true, false, 'published'),

-- Older Kids
('name-epic-quest',
 '{"en": "[Name]''s Epic Quest", "de": "[Name]s epische Suche", "he": "המסע האפי של [Name]"}',
 '{"en": "In a land where stories come alive, [Name] must find the three lost crystals before darkness falls. An epic fantasy adventure filled with riddles, allies, and courage.", "de": "In einem Land, wo Geschichten lebendig werden, muss [Name] die drei verlorenen Kristalle finden, bevor die Dunkelheit hereinbricht.", "he": "בארץ שבה סיפורים מתעוררים לחיים, [Name] חייב/ת למצוא את שלושת הגבישים האבודים לפני שהחושך יורד."}',
 '{"en": ["Epic fantasy world-building", "Teaches courage and perseverance", "Multiple quest challenges"], "de": ["Epische Fantasy-Weltgestaltung", "Lehrt Mut und Ausdauer", "Mehrere Quest-Herausforderungen"], "he": ["בניית עולם פנטזיה אפית", "מלמד אומץ והתמדה", "אתגרי משימה מרובים"]}',
 'older_kids', 7, 12, 'adventure', ARRAY['adventure', 'fantasy'], 16, 'watercolor', 86, true, false, 'published'),

-- Adults
('why-i-love-partner',
 '{"en": "Why I Love [Partner Name]", "de": "Warum ich [Partner Name] liebe", "he": "למה אני אוהב/ת את [Partner Name]"}',
 '{"en": "A heartfelt, personalized love story celebrating everything that makes [Partner Name] special. From the little moments to the big adventures, this book captures the essence of your love.", "de": "Eine herzliche, personalisierte Liebesgeschichte, die alles feiert, was [Partner Name] besonders macht.", "he": "סיפור אהבה מרגש ומותאם אישית שחוגג את כל מה שהופך את [Partner Name] למיוחד/ת."}',
 '{"en": ["Perfect anniversary or Valentine''s gift", "Deeply personalized love story", "Beautiful romantic illustrations"], "de": ["Perfektes Jahrestags- oder Valentinsgeschenk", "Tief personalisierte Liebesgeschichte", "Schöne romantische Illustrationen"], "he": ["מתנה מושלמת ליום נישואין או ולנטיין", "סיפור אהבה מותאם אישית לעומק", "איורים רומנטיים יפהפיים"]}',
 'adults', 18, 99, 'romance', ARRAY['romance'], 12, 'watercolor', 89, true, true, 'published'),

('super-dad-name',
 '{"en": "Super Dad [Name] Saves the Day", "de": "Super Papa [Name] rettet den Tag", "he": "סופר אבא [Name] מציל את היום"}',
 '{"en": "Dad by day, superhero always! Follow [Name] as they juggle bedtime stories, pancake flipping, and saving the world — all before breakfast. A hilarious tribute to the world''s greatest dad.", "de": "Papa bei Tag, Superheld immer! Folge [Name] beim Jonglieren von Gutenachtgeschichten, Pfannkuchen-Wenden und Weltrettung.", "he": "אבא ביום, גיבור על תמיד! עקבו אחרי [Name] כשהוא מלהטט בין סיפורי שינה, הפיכת פנקייק והצלת העולם."}',
 '{"en": ["Hilarious dad tribute", "Perfect Father''s Day gift", "Fun superhero illustrations"], "de": ["Lustiger Papa-Tribut", "Perfektes Vatertagsgeschenk", "Lustige Superhelden-Illustrationen"], "he": ["מחווה מצחיקה לאבא", "מתנה מושלמת ליום האב", "איורים מהנים של גיבור על"]}',
 'adults', 18, 99, 'family', ARRAY['family', 'humor'], 12, 'cartoon', 93, true, true, 'published');
