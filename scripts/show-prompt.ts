
interface StoryGenerationInput {
    childName: string;
    childAge: number;
    bookTheme: string;
    bookType: string;
    pageCount?: number;
    characterDescription?: string;
    storyDescription?: string;
}

// Mimic the function in client.ts
function generatePrompt(input: StoryGenerationInput) {
    return `
    Create a children's book story based on the following details:
    - Child's Name: ${input.childName}
    - Age: ${input.childAge}
    - Theme: ${input.bookTheme}
    - Type: ${input.bookType}
    - Page Count: ${input.pageCount || 10}
    ${input.characterDescription ? `- Character Description: ${input.characterDescription}` : ''}
    ${input.storyDescription ? `- Specific Story Request: ${input.storyDescription}` : ''}

    The story should be engaging, age-appropriate, and magical.
    
    OUTPUT FORMAT:
    Return ONLY a valid JSON object with the following structure:
    {
        "title": "Title of the book",
        "characterDescription": "A detailed physical description of the main character (if not provided)",
        "pages": [
            {
                "pageNumber": 1,
                "text": "Story text for this page (keep it short for children)",
                "imagePrompt": "A detailed description of the illustration for this page, describing the scene and action"
            },
            ...
        ]
    }
    `;
}

// Sample Data based on user request
const sampleInput: StoryGenerationInput = {
    childName: "Alex",
    childAge: 5,
    bookTheme: "Space Adventure",
    bookType: "Cartoon Style",
    pageCount: 10,
    storyDescription: "Alex goes to the moon to find cheese.",
    characterDescription: "A boy with messy red hair, freckles, wearing a blue astronaut suit."
};

console.log("--- SIMULATED PROMPT TEST ---");
console.log(generatePrompt(sampleInput));
console.log("----------------------------");
