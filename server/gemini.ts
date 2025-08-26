import * as fs from "fs";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface PhotoVerificationResult {
  isValid: boolean;
  confidence: number;
  explanation: string;
  suggestedImprovements?: string;
  technicalQuality?: {
    sharpness: number;
    composition: number;
    lighting: number;
    exposure: string;
  };
  detectedObjects?: string[];
  weddingElements?: string[];
  atmosphere?: string;
  peopleCount?: number;
  location?: string;
  emotions?: string[];
  category?: string;
  tags?: string[];
  creativeTips?: string;
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

    const systemPrompt = `Jste expert na hodnoceni svatebních fotografií. Analyzujte poskytnutou fotografii komplexne.

Ukol: "${challengeTitle}"
Popis: "${challengeDescription}"

Vyhodnotte fotografii podle techto kriterii:
1. Relevance k ukolu (odpovida fotka zadani?)
2. Kvalita provedeni (je fotka ostra, dobre komponovana?)
3. Svatební kontext (je to opravdu ze svatby?)
4. Technicke parametry a kompozice
5. Rozpoznani objektu a atmosfery
6. Emocni obsah

Odpovezte POUZE ve formatu JSON s temito poli (zadne dalsi text):
{
"isValid": boolean,
"confidence": number,
"explanation": "kratke vysvetleni v cestine",
"suggestedImprovements": "navrhy na zlepseni",
"technicalQuality": {
  "sharpness": number,
  "composition": number,
  "lighting": number,
  "exposure": "spravna"
},
"detectedObjects": ["seznam objektu"],
"weddingElements": ["svatebni prvky"],
"atmosphere": "nálada",
"peopleCount": number,
"location": "typ mista",
"emotions": ["emoce"],
"category": "kategorie",
"tags": ["hashtags"],
"creativeTips": "kreativni navrhy"
}`;

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
            technicalQuality: {
              type: SchemaType.OBJECT,
              properties: {
                sharpness: { type: SchemaType.NUMBER },
                composition: { type: SchemaType.NUMBER },
                lighting: { type: SchemaType.NUMBER },
                exposure: { type: SchemaType.STRING }
              }
            },
            detectedObjects: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            weddingElements: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            atmosphere: { type: SchemaType.STRING },
            peopleCount: { type: SchemaType.NUMBER },
            location: { type: SchemaType.STRING },
            emotions: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            category: { type: SchemaType.STRING },
            tags: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            creativeTips: { type: SchemaType.STRING }
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
        // More aggressive JSON cleaning
        let cleanedJson = rawJson
          // Remove all control characters and weird encoding
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          .replace(/\r\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\t/g, ' ')
          .replace(/\s+/g, ' ')
          // Remove any non-printable characters
          .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F]/g, '')
          .trim();
        
        console.log('Raw response length:', rawJson.length);
        console.log('Cleaned response preview:', cleanedJson.substring(0, 300));
        
        // Find JSON boundaries more reliably
        const jsonStart = cleanedJson.indexOf('{');
        const jsonEnd = cleanedJson.lastIndexOf('}') + 1;
        
        if (jsonStart === -1 || jsonEnd <= jsonStart) {
          throw new Error("JSON object not found in response");
        }
        
        let jsonString = cleanedJson.substring(jsonStart, jsonEnd);
        
        // Fix common JSON issues
        jsonString = jsonString
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/([{,]\s*)"(\w+)":\s*"([^"]*)"([^,}\]]*)/g, (match, prefix, key, value, suffix) => {
            // Clean up string values
            const cleanValue = value.replace(/"/g, '\\"');
            return `${prefix}"${key}":"${cleanValue}"${suffix}`;
          });
        
        console.log('Final JSON string:', jsonString.substring(0, 500));
        
        const result: PhotoVerificationResult = JSON.parse(jsonString);
        
        // Strict validation with defaults
        const validatedResult: PhotoVerificationResult = {
          isValid: typeof result.isValid === 'boolean' ? result.isValid : false,
          confidence: (typeof result.confidence === 'number' && result.confidence >= 0 && result.confidence <= 1) 
            ? result.confidence : 0.5,
          explanation: typeof result.explanation === 'string' && result.explanation.length > 0 
            ? result.explanation : "AI analýza byla dokončena",
          suggestedImprovements: typeof result.suggestedImprovements === 'string' 
            ? result.suggestedImprovements : undefined,
          technicalQuality: result.technicalQuality || undefined,
          detectedObjects: Array.isArray(result.detectedObjects) ? result.detectedObjects : undefined,
          weddingElements: Array.isArray(result.weddingElements) ? result.weddingElements : undefined,
          atmosphere: typeof result.atmosphere === 'string' ? result.atmosphere : undefined,
          peopleCount: typeof result.peopleCount === 'number' ? result.peopleCount : undefined,
          location: typeof result.location === 'string' ? result.location : undefined,
          emotions: Array.isArray(result.emotions) ? result.emotions : undefined,
          category: typeof result.category === 'string' ? result.category : undefined,
          tags: Array.isArray(result.tags) ? result.tags : undefined,
          creativeTips: typeof result.creativeTips === 'string' ? result.creativeTips : undefined
        };
        
        console.log('Validated result:', { 
          isValid: validatedResult.isValid, 
          confidence: validatedResult.confidence,
          explanation: validatedResult.explanation?.substring(0, 100)
        });
        
        return validatedResult;
        
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw JSON that failed:', rawJson.substring(0, 1000));
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

export async function moderateContent(imagePath: string): Promise<{
  isAppropriate: boolean;
  confidence: number;
  issues: string[];
  autoAction: 'approve' | 'flag' | 'reject';
}> {
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
      `Analyzujte tento obsah z hlediska vhodnosti pro svatební aplikaci. Kontrolujte:
      - Nevhodný obsah (násilí, sexuální obsah)
      - Spam nebo reklamní obsah
      - Nepříbuzný obsah (ne-svatební fotky)
      - Kvalita obrazu (rozmazané, poškozené)
      
      Odpovězte JSON formátem:
      {
        "isAppropriate": boolean,
        "confidence": number (0-1),
        "issues": ["seznam problémů"],
        "autoAction": "approve" | "flag" | "reject"
      }`,
    ];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const response = await model.generateContent(contents);
    const result = JSON.parse(response.response.text());
    
    return {
      isAppropriate: result.isAppropriate || false,
      confidence: result.confidence || 0,
      issues: result.issues || [],
      autoAction: result.autoAction || 'flag'
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    return {
      isAppropriate: false,
      confidence: 0,
      issues: ['Chyba při moderaci obsahu'],
      autoAction: 'flag'
    };
  }
}