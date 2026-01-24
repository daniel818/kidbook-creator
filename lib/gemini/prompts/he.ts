// Hebrew AI Prompts for Story Generation

export const getStoryPrompt = (input: {
    childName: string;
    childAge: number;
    bookTheme: string;
    bookType: string;
    pageCount: number;
    characterDescription?: string;
    storyDescription?: string;
}) => `
צור סיפור לספר ילדים על סמך הפרטים הבאים:
- שם הילד: ${input.childName}
- גיל: ${input.childAge}
- נושא: ${input.bookTheme}
- סוג: ${input.bookType}
- מספר עמודים: ${input.pageCount}
${input.characterDescription ? `- תיאור הדמות: ${input.characterDescription}` : ''}
${input.storyDescription ? `- בקשה ספציפית לסיפור: ${input.storyDescription}` : ''}

הסיפור צריך להיות מרתק, מתאים לגיל וקסום.
חשוב: כתוב את כל הסיפור בעברית.

פורמט פלט:
החזר רק אובייקט JSON תקין עם המבנה הבא:
{
    "title": "כותרת הספר",
    "backCoverBlurb": "סיכום קצר ומרתק של הסיפור לכריכה האחורית (מקסימום 2-3 משפטים)",
    "characterDescription": "תיאור פיזי מפורט של הדמות הראשית (אם לא סופק)",
    "pages": [
        {
            "pageNumber": 1,
            "text": "טקסט הסיפור לעמוד זה (שמור על קצר לילדים)",
            "imagePrompt": "תיאור מפורט של האיור לעמוד זה, המתאר רק את הסצנה והפעולה. אל תתאר את סגנון האמנות (למשל 'קריקטורה', 'צבעי מים') מכיוון שזה מטופל בנפרד."
        },
        ...
    ]
}
`;

export const getCharacterExtractionPrompt = () => `
נתח את התמונה הזו וצור תיאור התייחסות מפורט מאוד של הדמות עבור מחולל תמונות AI.
התמקד ב:
- תכונות פיזיות (צורת פנים, עיניים, אף, פה, גוון עור)
- שיער (צבע, סגנון, אורך, מרקם)
- מראה גיל
- תכונות ייחודיות
- סגנון לבוש (אם נראה)

היה ספציפי ומפורט. תיאור זה ישמש ליצירת איורי דמויות עקביים.
`;

export const getIllustrationPrompt = (
    scenePrompt: string,
    characterDescription: string,
    stylePrompt: string,
    aspectRatio: '1:1' | '3:4',
    hasReferenceImage: boolean
) => {
    let prompt = `צור איור לספר ילדים.
סגנון: ${stylePrompt}
סצנה: ${scenePrompt}
דמות: ${characterDescription}
יחס: ${aspectRatio === '1:1' ? 'ריבוע 1:1' : '3:4 אנכי'}.
איכות גבוהה, תוסס, מפורט.
וודא שסגנון האמנות עקבי עם התיאור לעיל.`;

    if (hasReferenceImage) {
        prompt += "\nחשוב: הדמות חייבת להיראות בדיוק כמו הילד בתמונת הייחוס שסופקה. שמור על תווי פנים, שיער ודמיון.";
    }

    return prompt;
};
