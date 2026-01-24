// German AI Prompts for Story Generation

export const getStoryPrompt = (input: {
    childName: string;
    childAge: number;
    bookTheme: string;
    bookType: string;
    pageCount: number;
    characterDescription?: string;
    storyDescription?: string;
}) => `
Erstelle eine Kindergeschichte basierend auf den folgenden Details:
- Name des Kindes: ${input.childName}
- Alter: ${input.childAge}
- Thema: ${input.bookTheme}
- Typ: ${input.bookType}
- Seitenanzahl: ${input.pageCount}
${input.characterDescription ? `- Charakterbeschreibung: ${input.characterDescription}` : ''}
${input.storyDescription ? `- Spezifische Geschichte Anfrage: ${input.storyDescription}` : ''}

Die Geschichte sollte fesselnd, altersgerecht und magisch sein.
WICHTIG: Schreibe die gesamte Geschichte auf Deutsch.

AUSGABEFORMAT:
Gib NUR ein gültiges JSON-Objekt mit der folgenden Struktur zurück:
{
    "title": "Titel des Buches",
    "backCoverBlurb": "Eine kurze, ansprechende Zusammenfassung der Geschichte für die Rückseite (maximal 2-3 Sätze)",
    "characterDescription": "Eine detaillierte physische Beschreibung der Hauptfigur (falls nicht angegeben)",
    "pages": [
        {
            "pageNumber": 1,
            "text": "Geschichtentext für diese Seite (kurz halten für Kinder)",
            "imagePrompt": "Eine detaillierte Beschreibung der Illustration für diese Seite, die NUR die Szene und Handlung beschreibt. Beschreibe NICHT den Kunststil (z.B. 'Cartoon', 'Aquarell'), da dies separat behandelt wird."
        },
        ...
    ]
}
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
