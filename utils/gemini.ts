import { GoogleGenAI } from '@google/genai';

// Инициализируем клиент с твоим ключом
// Ключ теперь безопасно подтягивается из окружения
const ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY });

export interface ParsedFood {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  analysis: string;
}

export async function parseFoodText(text: string): Promise<ParsedFood> {
  // Жестко требуем конкретные имена ключей в промпте
  const prompt = `
    You are an elite sports nutrition AI. Analyze this food intake text: "${text}".
    Calculate the total calories (kcal), protein (grams), fat (grams), and carbohydrates (grams).
    
    You MUST return a JSON object with EXACTLY these keys. Do not change spelling:
    {
      "calories": 0,
      "protein": 0,
      "fat": 0,
      "carbs": 0,
      "analysis": "Short 1-sentence breakdown"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const rawText = response.text?.trim();
    
    if (!rawText) {
      throw new Error('Gemini returned an empty response');
    }

    console.log('--- CLEAN AI JSON RESPONSE ---', rawText);

    const data = JSON.parse(rawText);

    // Мапим данные и страхуем синонимы ключей (на случай, если ИИ импровизирует)
    const cal = data.calories ?? data.kcal ?? 0;
    const pro = data.protein ?? data.proteins ?? data.protein_g ?? 0;
    const f = data.fat ?? data.fats ?? data.fat_g ?? 0;
    const carb = data.carbs ?? data.carbohydrates ?? data.carbs_g ?? 0;
    const textAnalysis = data.analysis ?? 'Tracked successfully';

    return {
      calories: Math.round(Number(cal)),
      protein: Math.round(Number(pro)),
      fat: Math.round(Number(f)),
      carbs: Math.round(Number(carb)),
      analysis: String(textAnalysis)
    };

  } catch (error: any) {
    console.log('============= DETAILED AI ERROR =============');
    console.log(error?.message || error);
    console.log('=============================================');
    throw error;
  }
}