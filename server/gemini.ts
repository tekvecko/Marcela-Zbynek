import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface PhotoVerificationResult {
  isValid: boolean;
  confidence: number;
  explanation: string;
  suggestedImprovements?: string;
}

export async function verifyPhotoForChallenge(
  imagePath: string,
  challengeTitle: string,
  challengeDescription: string
): Promise<PhotoVerificationResult> {
  try {
    const imageBytes = fs.readFileSync(imagePath);

    const systemPrompt = `Jste expert na hodnocení svatebních fotografií. Analyzujte poskytnutou fotografii a určete, zda splňuje požadavky zadaného úkolu.

Úkol: "${challengeTitle}"
Popis: "${challengeDescription}"

Vyhodnoťte fotografii podle těchto kritérií:
1. Relevance k úkolu (odpovídá fotka zadání?)
2. Kvalita provedení (je fotka ostrá, dobře komponovaná?)
3. Svatební kontext (je to opravdu ze svatby?)

Odpovězte ve formátu JSON s těmito poli:
- isValid: boolean (true pokud fotka splňuje úkol)
- confidence: number (0-1, jak si jste jistí hodnocením)
- explanation: string (krátké vysvětlení v češtině)
- suggestedImprovements: string (nepovinné, návrhy na zlepšení)`;

    const contents = [
      {
        inlineData: {
          data: imageBytes.toString("base64"),
          mimeType: "image/jpeg",
        },
      },
      `Analyzujte tuto fotografii podle zadaného úkolu: "${challengeTitle}" - ${challengeDescription}`,
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            isValid: { type: "boolean" },
            confidence: { type: "number" },
            explanation: { type: "string" },
            suggestedImprovements: { type: "string" },
          },
          required: ["isValid", "confidence", "explanation"],
        },
      },
      contents: contents,
    });

    const rawJson = response.text;
    console.log(`Gemini verification response: ${rawJson}`);

    if (rawJson) {
      const result: PhotoVerificationResult = JSON.parse(rawJson);
      return result;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error('Gemini verification error:', error);
    // Fallback response in case of error
    return {
      isValid: true, // Be permissive on errors
      confidence: 0.5,
      explanation: "Automatické ověření se nezdařilo, fotka byla přijata.",
      suggestedImprovements: "Zkuste nahrát fotku znovu pro lepší ověření."
    };
  }
}

export async function analyzePhotoContent(imagePath: string): Promise<string> {
  try {
    const imageBytes = fs.readFileSync(imagePath);

    const contents = [
      {
        inlineData: {
          data: imageBytes.toString("base64"),
          mimeType: "image/jpeg",
        },
      },
      `Popište tuto svatební fotografii v češtině. Zaměřte se na:
      - Co je na fotografii vidět
      - Jaká je nálada a atmosféra
      - Svatební prvky a detaily
      Odpovězte stručně a poeticky.`,
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    return response.text || "Krásná svatební vzpomínka.";
  } catch (error) {
    console.error('Photo analysis error:', error);
    return "Krásná svatební vzpomínka.";
  }
}