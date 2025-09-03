import { log } from "./vite";

interface RequiredSecret {
  key: string;
  description: string;
  required: boolean;
  example?: string;
  generateDefault?: () => string;
}

const REQUIRED_SECRETS: RequiredSecret[] = [
  {
    key: 'GEMINI_API_KEY',
    description: 'Google Gemini AI API klíč pro automatické ověřování fotografií',
    required: true,
    example: 'AIza...'
  },
  {
    key: 'ADMIN_EMAIL',
    description: 'E-mail pro admin účet',
    required: false,
    example: 'admin@example.com',
    generateDefault: () => process.env.REPL_OWNER ? `${process.env.REPL_OWNER}@admin.local` : 'admin@example.com'
  },
  {
    key: 'ADMIN_PASSWORD',
    description: 'Heslo pro admin účet',
    required: false,
    generateDefault: () => generateRandomPassword()
  },
  {
    key: 'JWT_SECRET',
    description: 'Tajný klíč pro JWT tokeny',
    required: false,
    generateDefault: () => generateRandomString(64)
  }
];

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function initializeSecrets(): Promise<boolean> {
  console.log("🔐 Kontroluji SECRETS a komponenty...");

  const missingRequired: RequiredSecret[] = [];
  const missingOptional: RequiredSecret[] = [];

  for (const secret of REQUIRED_SECRETS) {
    if (!process.env[secret.key]) {
      if (secret.required) {
        missingRequired.push(secret);
      } else {
        missingOptional.push(secret);
      }
    }
  }

  // Check critical environment variables
  const criticalEnvVars = ['DATABASE_URL', 'NODE_ENV'];
  const missingCritical = criticalEnvVars.filter(key => !process.env[key]);

  if (missingCritical.length > 0) {
    console.log(`⚠️  Chybějící kritické proměnné: ${missingCritical.join(', ')}`);
    // Set defaults for missing critical vars
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'development';
      console.log("✅ NODE_ENV nastaveno na 'development'");
    }
  }

  // Pokud chybí povinné SECRETS
  if (missingRequired.length > 0) {
    console.log("\n🚨 CHYBÍ POVINNÉ SECRETS:");
    console.log("=" .repeat(50));

    for (const secret of missingRequired) {
      console.log(`❌ ${secret.key}`);
      console.log(`   📝 ${secret.description}`);
      if (secret.example) {
        console.log(`   💡 Příklad: ${secret.example}`);
      }
      console.log("");
    }

    console.log("🔧 NÁVOD K NASTAVENÍ:");
    console.log("1. Otevřete záložku 'Secrets' (🔒) v levém panelu");
    console.log("2. Klikněte 'New Secret'");
    console.log("3. Přidejte chybějící SECRETS podle výše uvedených názvů");
    console.log("4. Restartujte aplikaci (Stop → Run)");
    console.log("\n⚠️  Aplikace se nepustí bez povinných SECRETS!");

    return false;
  }

  // Automaticky vygeneruj volitelné SECRETS
  if (missingOptional.length > 0) {
    console.log("\n🔧 Generuji chybějící volitelné SECRETS...");

    for (const secret of missingOptional) {
      if (secret.generateDefault) {
        const defaultValue = secret.generateDefault();
        process.env[secret.key] = defaultValue;

        console.log(`✅ ${secret.key}: vygenerováno`);

        // Uložit do .env pro persistence (volitelné)
        if (secret.key === 'ADMIN_PASSWORD') {
          console.log(`🔑 Vygenerované admin heslo: ${defaultValue}`);
          console.log("💾 Doporučujeme si heslo uložit nebo změnit v Secrets");
        }
      }
    }
  }

  // Automaticky vygeneruj JWT_SECRET pokud chybí
  if (!process.env.JWT_SECRET) {
    const crypto = await import('crypto');
    const generatedSecret = crypto.randomBytes(64).toString('hex');
    process.env.JWT_SECRET = generatedSecret;
    console.log("🔐 JWT_SECRET automaticky vygenerován (doporučuji nastavit v Secrets)");
  }

  console.log("✅ Všechny potřebné SECRETS jsou nastaveny");
  return true;
}

export function getSecretStatus(): { required: string[], optional: string[], missing: string[] } {
  const required: string[] = [];
  const optional: string[] = [];
  const missing: string[] = [];

  for (const secret of REQUIRED_SECRETS) {
    if (process.env[secret.key]) {
      if (secret.required) {
        required.push(secret.key);
      } else {
        optional.push(secret.key);
      }
    } else {
      missing.push(secret.key);
    }
  }

  return { required, optional, missing };
}