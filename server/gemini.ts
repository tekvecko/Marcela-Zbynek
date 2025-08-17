import * as fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface PhotoVerificationResult {
  isValid: boolean;
  confidence: number;
  explanation: string;
  suggestedImprovements?: string;
}

function getMimeTypeFromPath(imagePath: string): string {
  const ext = imagePath.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
    case 'heif':
      // Gemini supports HEIC/HEIF, use appropriate MIME type
      return 'image/heic';
    default:
      return 'image/jpeg'; // Default fallback
  }
}

export async function verifyPhotoForChallenge(
  imagePath: string,
  challengeTitle: string,
  challengeDescription: string
): Promise<PhotoVerificationResult> {
  try {
    const imageBytes = fs.readFileSync(imagePath);
    const mimeType = getMimeTypeFromPath(imagePath);

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
          mimeType: mimeType,
        },
      },
      `Analyzujte tuto fotografii podle zadaného úkolu: "${challengeTitle}" - ${challengeDescription}`,
    ];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
      generationConfig: {
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
    });

    const response = await model.generateContent(contents);

    const rawJson = response.response.text();
    console.log(`Gemini verification response: ${rawJson.substring(0, 500)}...`);

    if (rawJson) {
      try {
        // Clean the JSON response - remove any invalid characters
        const cleanedJson = rawJson.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
        
        // Try to find the JSON object boundaries
        const jsonStart = cleanedJson.indexOf('{');
        const jsonEnd = cleanedJson.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonString = cleanedJson.substring(jsonStart, jsonEnd);
          const result: PhotoVerificationResult = JSON.parse(jsonString);
          
          // Validate the result
          if (typeof result.isValid === 'boolean' && 
              typeof result.confidence === 'number' && 
              typeof result.explanation === 'string') {
            return result;
          }
        }
        
        throw new Error("Invalid JSON structure");
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
      }
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
    const mimeType = getMimeTypeFromPath(imagePath);

    const contents = [
      {
        inlineData: {
          data: imageBytes.toString("base64"),
          mimeType: mimeType,
        },
      },
      `Popište tuto svatební fotografii v češtině. Zaměřte se na:
      - Co je na fotografii vidět
      - Jaká je nálada a atmosféra
      - Svatební prvky a detaily
      Odpovězte stručně a poeticky.`,
    ];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });

    const response = await model.generateContent(contents);

    return response.response.text() || "Krásná svatební vzpomínka.";
  } catch (error) {
    console.error('Photo analysis error:', error);
    return "Krásná svatební vzpomínka.";
  }
}