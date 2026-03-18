import { GoogleGenAI, Type, Schema } from "@google/genai";

const AGENT_MODEL = 'gemini-3-pro-preview';

const getAI = (apiKey?: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
};

export const runCostumeAgent = async (
  sceneContent: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are the **Costume Designer Agent**.
    Analyze the script scene for **Wardrobe, Clothing, and Accessories**.

    FOCUS: What characters are wearing, footwear, and fabric conditions.

    Extract requirements for:
    1. **Character Specifics**: Specific garments mentioned for each character (e.g., "John: Tuxedo", "Sarah: Wet wetsuit").
    2. **Condition/States**: Dirty, bloody, wet, torn, burnt, pristine.
    3. **Accessories**: Glasses, watches, jewelry, hats, masks, gloves.
    4. **Action**: Requirements like "coat is taken off", "tie is loosened", "pocket used".

    RULES:
    - **Context Matters**: "John wipes his bloody hands on his shirt" -> extract "John: Bloody shirt".
    - **Exclusions**: Do not list handheld props (like guns or phones) unless they are holstered/worn.
    - **Be Precise**: "Muddy combat boots" is better than "Shoes".

    Return JSON: { "items": string[] }
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      items: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["items"]
  };

  try {
    const response = await ai.models.generateContent({
      model: AGENT_MODEL,
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'user', parts: [{ text: `SCENE CONTENT:\n${sceneContent}` }] }
      ],
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return (response.text ? JSON.parse(response.text).items : []) || [];
  } catch (error) {
    console.warn("Costume Agent failed:", error);
    return [];
  }
};