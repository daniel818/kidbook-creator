// German AI Prompts for Story Generation

export const getStoryPrompt = (input: {
    childName: string;
    childAge: number;
    childGender?: 'boy' | 'girl' | 'other';
    bookTheme: string;
    bookType: string;
    pageCount: number;
    characterDescription?: string;
    storyDescription?: string;
}) => `
Erstelle eine Kindergeschichte basierend auf den folgenden Details:
- Name des Kindes: ${input.childName}
- Alter: ${input.childAge}
- Geschlecht: ${input.childGender || 'nicht angegeben'}
- Thema: ${input.bookTheme}
- Typ: ${input.bookType}
- Seitenanzahl: ${input.pageCount}
${input.characterDescription ? `- Charakterbeschreibung: ${input.characterDescription}` : ''}
${input.storyDescription ? `- Spezifische Geschichte Anfrage: ${input.storyDescription}` : ''}

Die Geschichte sollte fesselnd, altersgerecht und magisch sein.

KRITISCH WICHTIG: 
- Schreibe die GESAMTE Geschichte ausschließlich auf DEUTSCH
- KEIN ENGLISCH verwenden - alle Wörter müssen Deutsch sein
- Titel, Text und imagePrompt müssen komplett auf Deutsch sein
- Verwende nur deutsche Wörter und Grammatik
- Pronomen-Regel: Bei Geschlecht boy verwende männliche Pronomen (er/ihn); bei girl weibliche (sie/ihr); bei other neutrale Pronomen.
- Bei Geschlecht other beschreibe die Figur geschlechtsneutral (keine geschlechtsspezifische Kleidung/Eigenschaften).

AUSGABEFORMAT:
Gib NUR ein gültiges JSON-Objekt mit der folgenden Struktur zurück.
ALLE Felder müssen auf DEUTSCH sein:
{
    "title": "Deutscher Titel des Buches",
    "backCoverBlurb": "Eine kurze, ansprechende deutsche Zusammenfassung der Geschichte für die Rückseite (maximal 2-3 Sätze)",
    "characterDescription": "Eine detaillierte physische Beschreibung der Hauptfigur auf Deutsch (falls nicht angegeben)",
    "pages": [
        {
            "pageNumber": 1,
            "text": "Deutscher Geschichtentext für diese Seite (kurz halten für Kinder) - NUR DEUTSCH",
            "imagePrompt": "Eine detaillierte deutsche Beschreibung der Illustration für diese Seite, die NUR die Szene und Handlung beschreibt. Beschreibe NICHT den Kunststil (z.B. 'Cartoon', 'Aquarell'), da dies separat behandelt wird. - NUR DEUTSCH"
        },
        ...
    ]
}

NOCHMALS: Verwende AUSSCHLIESSLICH deutsche Sprache in ALLEN Feldern. KEIN Englisch!
`;

export const getCharacterExtractionPrompt = () => `
Analysiere dieses Bild und erstelle eine sehr detaillierte Charakterreferenzbeschreibung für einen KI-Bildgenerator.
Konzentriere dich auf:
- Physische Merkmale (Gesichtsform, Augen, Nase, Mund, Hautton)
- Haare (Farbe, Stil, Länge, Textur)
- Alterserscheinung
- Besondere Merkmale
- Kleidungsstil (falls sichtbar)

Sei spezifisch und detailliert. Diese Beschreibung wird verwendet, um konsistente Charakterillustrationen zu generieren.
`;

export const getIllustrationPrompt = (
    scenePrompt: string,
    characterDescription: string,
    stylePrompt: string,
    aspectRatio: '1:1' | '3:4',
    hasReferenceImage: boolean
) => {
    let prompt = `Generiere eine Kinderbuchillustration.
Stil: ${stylePrompt}
Szene: ${scenePrompt}
Charakter: ${characterDescription}
Verhältnis: ${aspectRatio === '1:1' ? 'Quadratisch 1:1' : '3:4 Hochformat'}.
Hohe Qualität, lebhaft, detailliert.
Stelle sicher, dass der Kunststil mit der obigen Beschreibung übereinstimmt.`;

    if (hasReferenceImage) {
        prompt += "\nWICHTIG: Der Charakter MUSS genau wie das Kind im bereitgestellten Referenzbild aussehen. Behalte Gesichtszüge, Haare und Ähnlichkeit bei.";
    }

    return prompt;
};
