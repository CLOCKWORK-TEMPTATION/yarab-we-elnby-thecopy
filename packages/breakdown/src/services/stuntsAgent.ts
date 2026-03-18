import { GoogleGenAI, Type, Schema } from "@google/genai";

const AGENT_MODEL = 'gemini-3-pro-preview';

const getAI = (apiKey?: string): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
};

export const runStuntsAgent = async (
  sceneContent: string,
  apiKey?: string
): Promise<string[]> => {
  const ai = getAI(apiKey);

  const prompt = `
    You are the **Stunt Coordinator Agent**.
    Analyze the script scene for **Stunts, Action, and Safety Risks**.

    FOCUS: Physical action, violence, dangerous activities, and complex movement requiring supervision.

    Extract requirements for:
    1. **Combat**: Fights (punches, kicks, grappling, slaps), weapon play (sword fighting, shooting, knife fights).
    2. **Falls/Jumps**: Falling down stairs, jumping across rooftops, falling from height.
    3. **Vehicular Stunts**: Car chases, crashes, near misses, precision driving, being hit by a car.
    4. **Environmental Hazards**: Fire burns, underwater sequences, explosions near actors, breaking through glass.
    5. **Wire Work**: Flying, levitating, being thrown backward by force.

    RULES:
    - **Identify Personnel**: Suggest "Stunt Double needed for [Character]" if the action is dangerous.
    - **Specificity**: "Fall" is vague. "Fall 10 feet onto concrete" is useful.

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
    console.warn("Stunts Agent failed:", error);
    return [];
  }
};