import Groq from 'groq-sdk';
import supabase from '../config/supabaseClient.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const suggestEventTheme = async (req, res) => {
    try {
        const { category, answers, imageBase64 } = req.body;

        if (!category || !answers) {
            return res.status(400).json({ error: "Category and answers are required." });
        }

        // 1. FETCH REAL VENUES DIRECTLY FROM SUPABASE
        const { data: venuesData, error: venueError } = await supabase
            .from('venues')
            .select('name');
            
        if (venueError) throw venueError;

        // 2. CREATE A COMMA-SEPARATED STRING OF VALID VENUES
        const venueString = venuesData ? venuesData.map(v => v.name).join(', ') : 'TBD';

        // 3. STRICT AI INSTRUCTIONS
        const instructions = `You are an elite event planner. Suggest an event theme and a suitable venue based on user quiz answers for a ${category} event.
        
        CRITICAL RULES:
        1. You MUST ONLY select a venue exactly from this list: [${venueString}]. 
        2. Do NOT invent, hallucinate, or suggest any venue not on that list.
        3. Return ONLY a valid JSON object.
        
        REQUIRED JSON FORMAT: { "theme_name": "Name of theme", "suggested_venue": "Exact Name of Venue from list" }`;

        let messages;
        let modelToUse;

        // DYNAMIC ROUTING: Choose model and format based on image presence
        if (imageBase64) {
            modelToUse = "meta-llama/llama-4-scout-17b-16e-instruct"; // Vision Model
            messages = [{
                role: "user",
                content: [
                    { type: "text", text: `${instructions}\n\nAnswers:\n${JSON.stringify(answers, null, 2)}\n\nPlease analyze the style, layout, and mood of the attached inspiration image to influence your theme suggestion.` },
                    { type: "image_url", image_url: { url: imageBase64 } } 
                ]
            }];
        } else {
            modelToUse = "llama-3.1-8b-instant"; // Fast Text Model
            messages = [
                { role: "system", content: instructions },
                { role: "user", content: `Answers:\n${JSON.stringify(answers)}` }
            ];
        }

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: modelToUse,
            temperature: 0.1, // Lower temperature makes it less creative with facts (stops hallucinations)
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
        res.status(200).json(result);

    } catch (err) {
        console.error("AI Suggestion Error:", err);
        res.status(500).json({ error: "Failed to generate AI suggestion." });
    }
};