import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export const generateStructuredContent = async (systemPrompt, userPrompt, retries = 2) => {
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error("AI API Keys are missing.");
  }
  
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    console.log(`[Groq] Attempting... (Retries left: ${retries})`);
    
    const groqResponse = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, 
    });

    return JSON.parse(groqResponse.choices[0].message.content);

  } catch (groqError) {
    // If it's a rate limit (429), retry after delay
    if (groqError.status === 429 && retries > 0) {
      console.warn(`[Groq] Rate limit hit. Retrying in 10s...`);
      await delay(10000);
      return generateStructuredContent(systemPrompt, userPrompt, retries - 1);
    }

    console.warn(`[Groq Failure]: ${groqError.message}`);
    console.log("Engaging Fallback Protocol...");

    try {
      console.log("Routing to Secondary Provider (Gemini)...");
      
      const geminiModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Reverted to flash, as it's the most stable free-tier model
        generationConfig: { temperature: 0.2 }
      });

      const combinedPrompt = `${systemPrompt}\n\nUser Request:\n${userPrompt}`;
      const geminiResponse = await geminiModel.generateContent(combinedPrompt);
      
      const responseText = geminiResponse.response.text();
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      
      return JSON.parse(cleanJson);
    } catch (geminiError) {
      console.error(`[Gemini Failure]: ${geminiError.message}`);
      throw new Error("AI engines failed. Please try again.");
    }
  }
};