import * as fs from "fs";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

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

async function attemptGeminiVerification(
  imagePath: string,
  challengeTitle: string,
  challengeDescription: string,
  retryCount = 0
): Promise<PhotoVerificationResult> {
  const maxRetries = 2;
  
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
          type: SchemaType.OBJECT,
          properties: {
            isValid: { type: SchemaType.BOOLEAN },
            confidence: { type: SchemaType.NUMBER },
            explanation: { type: SchemaType.STRING },
            suggestedImprovements: { type: SchemaType.STRING },
          },
          required: ["isValid", "confidence", "explanation"],
        },
        maxOutputTokens: 1000,
      },
    });

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout')), 30000); // 30 second timeout
    });

    const response = await Promise.race([
      model.generateContent(contents),
      timeoutPromise
    ]) as any;

    const rawJson = response.response.text();
    console.log(`Gemini verification response (attempt ${retryCount + 1}): ${rawJson.substring(0, 500)}...`);

    if (rawJson) {
      try {
        // Clean the JSON response more aggressively
        let cleanedJson = rawJson
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
          .replace(/\t+/g, ' ') // Replace tabs with spaces
          .replace(/\n+/g, ' ') // Replace newlines with spaces
          .replace(/\r+/g, ' ') // Replace carriage returns with spaces
          .replace(/\s+/g, ' ') // Collapse multiple spaces
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove additional control characters
          .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Keep only printable characters
          .trim();
        
        // Try to find the JSON object boundaries
        const jsonStart = cleanedJson.indexOf('{');
        const jsonEnd = cleanedJson.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          let jsonString = cleanedJson.substring(jsonStart, jsonEnd);
          
          // Additional cleanup for common issues
          jsonString = jsonString
            .replace(/,\s*}/g, '}') // Remove trailing commas
            .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove any remaining control chars
            .replace(/\\\\/g, '\\'); // Fix double backslashes
          
          console.log('Cleaned JSON string:', jsonString.substring(0, 200) + '...');
          
          const result: PhotoVerificationResult = JSON.parse(jsonString);
          
          // Validate the result structure and types
          if (typeof result.isValid === 'boolean' && 
              typeof result.confidence === 'number' && 
              typeof result.explanation === 'string' &&
              result.confidence >= 0 && result.confidence <= 1) {
            return result;
          }
        }
        
        throw new Error("Neplatná struktura JSON nebo chybí požadovaná pole");
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new Error(`Chyba při parsování odpovědi Gemini: ${errorMessage}`);
      }
    } else {
      throw new Error("Prázdná odpověď od Gemini");
    }
  } catch (error) {
    console.error(`Gemini verification error (attempt ${retryCount + 1}):`, error);
    
    // Retry for certain types of errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (retryCount < maxRetries && 
        (errorMessage.includes('Failed to parse') || 
         errorMessage.includes('Invalid JSON') ||
         errorMessage.includes('parsování odpovědi') ||
         errorMessage.includes('503') ||
         errorMessage.includes('429') ||
         errorMessage.includes('RATE_LIMIT_EXCEEDED'))) {
      console.log(`Retrying Gemini verification (attempt ${retryCount + 2}/${maxRetries + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
      return attemptGeminiVerification(imagePath, challengeTitle, challengeDescription, retryCount + 1);
    }
    
    // Fallback response in case of error - REJECT photos when AI fails
    return {
      isValid: false, // Be strict on errors to prevent random photo approval
      confidence: 0,
      explanation: "Automatické ověření se nezdařilo z technických důvodů. Zkuste nahrát fotku znovu.",
      suggestedImprovements: "Zkuste nahrát fotku znovu. Pokud problém přetrvává, obraťte se na podporu."
    };
  }
}

export async function verifyPhotoForChallenge(
  imagePath: string,
  challengeTitle: string,
  challengeDescription: string
): Promise<PhotoVerificationResult> {
  return attemptGeminiVerification(imagePath, challengeTitle, challengeDescription);
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