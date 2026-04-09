import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const analyzeProposal = async (req, res) => {
    try {
        const { event_title, category, request_note, requested_amount } = req.body;

        const instructions = `You are a strategic AI negotiation assistant for a corporate sponsor.
        Analyze the following event sponsorship proposal:
        Event: ${event_title} (${category})
        Requested Amount: $${requested_amount}
        Manager's Pitch: "${request_note || 'Standard sponsorship request'}"

        Create a data-driven counter-offer. Suggest a slightly lower or optimized investment amount based on the pitch, and write a professional counter-proposal note. 
        
        CRITICAL: Include a convincing, data-like rationale in your note (e.g., "Based on typical engagement metrics, brand placement on tickets yields 15% better retention than general banners, so we propose..."). Keep the note professional and under 4 sentences.

        Return ONLY a valid JSON object in this format:
        {
          "suggested_amount": 1000,
          "counter_note": "Your professional counter proposal here..."
        }`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: instructions }],
            model: "llama-3.1-8b-instant",
            temperature: 0.4,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
        res.status(200).json(result);

    } catch (err) {
        console.error("AI Analysis Error:", err);
        res.status(500).json({ error: "Failed to analyze proposal." });
    }
};