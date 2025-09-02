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

    const systemPrompt = `Jste expert na hodnoceni svatebních fotografií. Analyzujte poskytnutou fotografii.

Ukol: "${challengeTitle}"
Popis: "${challengeDescription}"

KRITICKÉ INSTRUKCE:
- Odpovězte POUZE platným JSON objektem
- ŽÁDNÝ text před nebo po JSON
- Maximální délka: explanation 80 znaků, suggestedImprovements 60 znaků
- Maximálně 3 prvky v každém array
- Používejte pouze hodnoty 0-1 pro confidence a technicalQuality

PŘÍKLAD SPRÁVNÉ ODPOVĚDI:
{"isValid":true,"confidence":0.85,"explanation":"Krásná svatební fotka","suggestedImprovements":"Více světla","technicalQuality":{"sharpness":0.8,"composition":0.9,"lighting":0.7,"exposure":"dobrá"},"detectedObjects":["nevěsta","ženich"],"weddingElements":["šaty","oblek"],"atmosphere":"romantická","peopleCount":2,"location":"kostel","emotions":["radost","láska"],"category":"portrét","tags":["elegantní"],"creativeTips":"Jiný úhel"}`;

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

    // Add timeout to prevent hanging - shorter timeout for better UX
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout')), 15000); // 15 second timeout
    });

    console.log('🤖 Sending request to Gemini AI...');
    const response = await Promise.race([
      model.generateContent(contents),
      timeoutPromise
    ]) as any;
    
    if (!response || !response.response) {
      throw new Error('Prázdná odpověď od Gemini API');
    }

    const rawJson = response.response.text();
    console.log(`Gemini verification response (attempt ${retryCount + 1}): ${rawJson.substring(0, 500)}...`);

    if (rawJson) {
      try {
        // More aggressive JSON cleaning with better fallback handling
        let cleanedJson = rawJson
          // Remove all control characters and weird encoding
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          .replace(/\r\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\t+/g, ' ')  // Replace multiple tabs with single space
          .replace(/\s+/g, ' ')
          // Remove any non-printable characters but preserve Czech characters
          .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF]/g, '')
          // Fix common Gemini malformed patterns
          .replace(/,\s*,/g, ',')  // Remove double commas
          .replace(/:\s*,/g, ': null,')  // Fix empty values
          // Truncate extremely long arrays that break JSON
          .replace(/"weddingElements":\s*\[([^\]]{500,})[^\]]*\]/g, '"weddingElements": []')
          .replace(/"detectedObjects":\s*\[([^\]]{300,})[^\]]*\]/g, '"detectedObjects": []')
          .replace(/"tags":\s*\[([^\]]{200,})[^\]]*\]/g, '"tags": []')
          .replace(/"emotions":\s*\[([^\]]{150,})[^\]]*\]/g, '"emotions": []')
          .trim();
        
        console.log('Raw response length:', rawJson.length);
        console.log('Cleaned response preview:', cleanedJson.substring(0, 300));
        
        // Find JSON boundaries more reliably with better error handling
        const jsonStart = cleanedJson.indexOf('{');
        let jsonEnd = cleanedJson.lastIndexOf('}');
        
        if (jsonStart === -1) {
          console.log('⚠️ No JSON object found, creating minimal response');
          return {
            isValid: false,
            confidence: 0.3,
            explanation: "AI analýza selhala kvůli chybě ve zpracování odpovědi."
          };
        }
        
        // If no closing brace found or it's before the start, reconstruct
        if (jsonEnd === -1 || jsonEnd <= jsonStart) {
          console.log('⚠️ No valid closing brace found, reconstructing JSON');
          
          // Try to find a reasonable cutoff point
          let reconstructedJson = cleanedJson.substring(jsonStart);
          
          // Aggressively cut off after explanation field if it exists
          const explanationMatch = reconstructedJson.match(/("explanation"\s*:\s*"[^"]{0,150}[^"]*?")/);
          if (explanationMatch) {
            const explanationEnd = reconstructedJson.indexOf(explanationMatch[1]) + explanationMatch[1].length;
            reconstructedJson = reconstructedJson.substring(0, explanationEnd) + '}';
          } else {
            // Fallback: try to preserve at least isValid and confidence
            const basicFieldsMatch = reconstructedJson.match(/\{[^}]*"confidence"\s*:\s*[\d.]+[^}]*"isValid"\s*:\s*(true|false)[^}]*/);
            if (basicFieldsMatch) {
              reconstructedJson = basicFieldsMatch[0] + '}';
            } else {
              // Last resort: create minimal valid JSON
              reconstructedJson = '{"isValid": false, "confidence": 0.5, "explanation": "AI analýza byla neúplná"}';
            }
          }
          
          cleanedJson = reconstructedJson;
          jsonEnd = cleanedJson.length;
        } else {
          jsonEnd = jsonEnd + 1;
        }
        
        let jsonString = cleanedJson.substring(jsonStart, jsonEnd);
        
        // Remove any clearly invalid trailing content
        jsonString = jsonString.replace(/[^}\]]*$/, ''); // Remove trailing non-JSON content
        
        // Pre-parse validation: ensure JSON structure integrity
        const bracesCount = (jsonString.match(/\{/g) || []).length - (jsonString.match(/\}/g) || []).length;
        if (bracesCount > 0) {
          jsonString += '}'.repeat(bracesCount);
        }
        
        // Validate that we have at least the minimum required JSON structure
        if (!jsonString.includes('"isValid"') || !jsonString.includes('"confidence"')) {
          console.log('⚠️ Missing required fields, creating minimal response');
          
          // Try to extract at least confidence if available
          const confMatch = jsonString.match(/"confidence"\s*:\s*([\d.]+)/);
          const validMatch = jsonString.match(/"isValid"\s*:\s*(true|false)/);
          const explMatch = jsonString.match(/"explanation"\s*:\s*"([^"]{0,80})"/);
          
          return {
            isValid: validMatch ? validMatch[1] === 'true' : false,
            confidence: confMatch ? Math.min(1, Math.max(0, parseFloat(confMatch[1]))) : 0.3,
            explanation: explMatch ? explMatch[1] : "AI analýza byla neúplná."
          };
        }
        
        // Fix problematic very long numbers that cause JSON parsing issues
        jsonString = jsonString.replace(/:\s*(\d+\.?\d*[e\-\+\d]*)/g, (match: string, number: string) => {
          const num = parseFloat(number);
          if (isNaN(num) || !isFinite(num)) return ': 0.7';
          // Round to reasonable precision and clamp to 0-1 range for scores
          const rounded = Math.max(0, Math.min(1, Math.round(num * 100) / 100));
          return `: ${rounded}`;
        })
        // Remove any extremely long decimal numbers before JSON parsing (more aggressive)
        .replace(/\d+\.\d{20,}/g, '0.8')
        // Remove any scientific notation with extremely long exponents
        .replace(/\d+\.?\d*e[\+\-]?\d{10,}/g, '0.8')
        // Fix specific cases of very long repeating decimals that break JSON
        .replace(/0\.8599999999999999[0-9]+/g, '0.86')
        .replace(/0\.9678901234567[0-9]+/g, '0.97');
        
        // Fix truncated arrays and objects more aggressively
        // If JSON ends abruptly in an array or object, close it properly
        if (jsonString.includes('[') && !jsonString.endsWith(']') && jsonString.lastIndexOf('[') > jsonString.lastIndexOf(']')) {
          const lastOpenBracket = jsonString.lastIndexOf('[');
          jsonString = jsonString.substring(0, lastOpenBracket) + '[]';
        }
        
        if (jsonString.includes('{') && !jsonString.endsWith('}')) {
          // Count braces to ensure proper closing
          const openBraces = (jsonString.match(/\{/g) || []).length;
          const closeBraces = (jsonString.match(/\}/g) || []).length;
          
          if (openBraces > closeBraces) {
            // Add missing closing braces
            jsonString += '}'.repeat(openBraces - closeBraces);
          }
        }
        
        // Fix arrays with too many repeated elements
        jsonString = jsonString.replace(/"weddingElements":\s*\[([^\]]*)\]/g, (match: string, content: string) => {
          try {
            const items = content.split(',').map((item: string) => item.trim().replace(/"/g, ''));
            const uniqueItems = Array.from(new Set(items)).slice(0, 10); // Limit to 10 unique items
            const cleanItems = uniqueItems.map(item => `"${item.replace(/"/g, '\\"')}"`);
            return `"weddingElements": [${cleanItems.join(', ')}]`;
          } catch {
            return '"weddingElements": []';
          }
        });
        
        // Fix common JSON issues
        jsonString = jsonString
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/([{,]\s*)"(\w+)":\s*"([^"]*)"([^,}\]]*)/g, (match: string, prefix: string, key: string, value: string, suffix: string) => {
            // Clean up string values and handle escaped quotes
            const cleanValue = value.replace(/"/g, '\\"').replace(/\t+/g, ' ');
            return `${prefix}"${key}": "${cleanValue}"${suffix}`;
          })
          // Fix any remaining malformed numbers
          .replace(/:\s*(\d+\.?\d*)[e\-\+\d]{50,}/g, ': 0.8') // Replace super long scientific notation
          .replace(/:\s*\d+\.\d{20,}/g, ': 0.8'); // Replace very long decimals
        
        console.log('Final JSON string:', jsonString.substring(0, 500));
        
        const result: PhotoVerificationResult = JSON.parse(jsonString);
        
        // Strict validation with defaults and better error handling
        const validatedResult: PhotoVerificationResult = {
          isValid: typeof result.isValid === 'boolean' ? result.isValid : false,
          confidence: (() => {
            const conf = result.confidence;
            if (typeof conf === 'number' && !isNaN(conf) && isFinite(conf)) {
              return Math.max(0, Math.min(1, conf));
            }
            return 0.7; // Default confidence when AI works
          })(),
          explanation: (() => {
            const exp = result.explanation;
            if (typeof exp === 'string' && exp.length > 0 && exp.length < 1000) {
              // Clean up explanation text
              return exp.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim();
            }
            return "AI analýza fotky byla dokončena úspěšně.";
          })(),
          suggestedImprovements: (() => {
            const imp = result.suggestedImprovements;
            if (typeof imp === 'string' && imp.length > 0 && imp.length < 500) {
              return imp.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim();
            }
            return undefined;
          })(),
          technicalQuality: (() => {
            const tq = result.technicalQuality;
            if (tq && typeof tq === 'object') {
              return {
                sharpness: typeof tq.sharpness === 'number' && isFinite(tq.sharpness) 
                  ? Math.max(0, Math.min(1, tq.sharpness)) : 0.7,
                composition: typeof tq.composition === 'number' && isFinite(tq.composition) 
                  ? Math.max(0, Math.min(1, tq.composition)) : 0.7,
                lighting: typeof tq.lighting === 'number' && isFinite(tq.lighting) 
                  ? Math.max(0, Math.min(1, tq.lighting)) : 0.7,
                exposure: typeof tq.exposure === 'string' ? tq.exposure : "dobrá"
              };
            }
            return undefined;
          })(),
          detectedObjects: Array.isArray(result.detectedObjects) 
            ? result.detectedObjects.slice(0, 15).filter(obj => typeof obj === 'string' && obj.length > 0)
            : undefined,
          weddingElements: Array.isArray(result.weddingElements) 
            ? result.weddingElements.slice(0, 10).filter(elem => typeof elem === 'string' && elem.length > 0)
            : undefined,
          atmosphere: typeof result.atmosphere === 'string' && result.atmosphere.length < 200 
            ? result.atmosphere : undefined,
          peopleCount: typeof result.peopleCount === 'number' && isFinite(result.peopleCount) && result.peopleCount >= 0 
            ? Math.floor(result.peopleCount) : undefined,
          location: typeof result.location === 'string' && result.location.length < 100 
            ? result.location : undefined,
          emotions: Array.isArray(result.emotions) 
            ? result.emotions.slice(0, 8).filter(emotion => typeof emotion === 'string' && emotion.length > 0)
            : undefined,
          category: typeof result.category === 'string' && result.category.length < 50 
            ? result.category : undefined,
          tags: Array.isArray(result.tags) 
            ? result.tags.slice(0, 10).filter(tag => typeof tag === 'string' && tag.length > 0)
            : undefined,
          creativeTips: typeof result.creativeTips === 'string' && result.creativeTips.length < 300 
            ? result.creativeTips.replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim() : undefined
        };
        
        console.log('Validated result:', { 
          isValid: validatedResult.isValid, 
          confidence: validatedResult.confidence,
          explanation: validatedResult.explanation?.substring(0, 100)
        });
        
        return validatedResult;
        
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw JSON that failed:', rawJson.substring(0, 500));
        
        // Try emergency extraction of basic fields from raw text
        const confMatch = rawJson.match(/"confidence"\s*:\s*([\d.]+)/);
        const validMatch = rawJson.match(/"isValid"\s*:\s*(true|false)/);
        const explMatch = rawJson.match(/"explanation"\s*:\s*"([^"]{0,80})"/);
        
        if (validMatch) {
          console.log('🔧 Using emergency field extraction');
          return {
            isValid: validMatch[1] === 'true',
            confidence: confMatch ? Math.min(1, Math.max(0, parseFloat(confMatch[1]))) : 0.5,
            explanation: explMatch ? explMatch[1] : "AI analýza byla částečně úspěšná"
          };
        }
        
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
    const isRetryableError = errorMessage.includes('Failed to parse') || 
                            errorMessage.includes('Invalid JSON') ||
                            errorMessage.includes('parsování odpovědi') ||
                            errorMessage.includes('503') ||
                            errorMessage.includes('429') ||
                            errorMessage.includes('RATE_LIMIT_EXCEEDED') ||
                            errorMessage.includes('timeout');
                            
    if (retryCount < maxRetries && isRetryableError) {
      console.log(`Retrying Gemini verification (attempt ${retryCount + 2}/${maxRetries + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
      return attemptGeminiVerification(imagePath, challengeTitle, challengeDescription, retryCount + 1);
    }
    
    // Provide more specific error messages based on error type
    let userMessage = "Automatické ověření se nezdařilo z technických důvodů.";
    let suggestionMessage = "Zkuste nahrát fotku znovu.";
    
    if (errorMessage.includes('403')) {
      userMessage = "Problém s API klíčem pro ověřování fotografií.";
      suggestionMessage = "Kontaktujte správce aplikace pro opravu konfigurace.";
    } else if (errorMessage.includes('timeout')) {
      userMessage = "Ověřování fotografií trvalo příliš dlouho.";
      suggestionMessage = "Zkuste nahrát menší fotografii nebo to zkuste znovu později.";
    } else if (errorMessage.includes('429') || errorMessage.includes('RATE_LIMIT')) {
      userMessage = "Příliš mnoho požadavků na ověřování fotografií.";
      suggestionMessage = "Počkejte chvilku a zkuste to znovu.";
    } else if (errorMessage.includes('Invalid JSON') || errorMessage.includes('Failed to parse')) {
      userMessage = "Chyba při zpracování výsledků ověření fotografií.";
      suggestionMessage = "Zkuste nahrát jinou fotografii.";
    }
    
    // Fallback response in case of error - REJECT photos when AI fails
    return {
      isValid: false, // Be strict on errors to prevent random photo approval
      confidence: 0,
      explanation: userMessage,
      suggestedImprovements: suggestionMessage + " Pokud problém přetrvává, obraťte se na podporu."
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
    console.error('Content moderation failed:', error);
    return {
      isAppropriate: false,
      confidence: 0,
      issues: ['Moderation service unavailable'],
      autoAction: 'flag'
    };
  }
}