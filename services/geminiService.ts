import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const expandConceptWithAI = async (concept: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 4 distinct, concise, and relevant sub-concepts or related ideas for the mind map topic: "${concept}". Return strictly a list of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relatedConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of 4 related concepts",
            },
          },
          required: ["relatedConcepts"],
        },
      },
    });

    const jsonStr = response.text;
    if (!jsonStr) return [];
    
    const parsed = JSON.parse(jsonStr);
    return parsed.relatedConcepts || [];
  } catch (error) {
    console.error("Error expanding concept:", error);
    return [];
  }
};

export const suggestMapFromTopic = async (topic: string): Promise<{ label: string; children: string[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a starting mind map structure for the topic: "${topic}". Provide a central concise label and 5 initial branches.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING, description: "The central node label (refined if needed)" },
            children: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5 initial sub-topics",
            },
          },
          required: ["label", "children"],
        },
      },
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No response from AI");
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating map:", error);
    throw error;
  }
};