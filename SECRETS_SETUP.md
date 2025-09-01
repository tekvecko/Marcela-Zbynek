
# 🔐 Nastavení SECRETS pro Wedding Photo Quest

## Automatické nastavení při remixování

Když remixnete tento projekt, aplikace automaticky zkontroluje potřebné SECRETS a vyzve vás k jejich doplnění.

## Povinné SECRETS

### GEMINI_API_KEY (POVINNÝ)
- **Popis**: Google Gemini AI API klíč pro automatické ověřování fotografií
- **Získání**: 
  1. Jděte na [Google AI Studio](https://aistudio.google.com/app/apikey)
  2. Přihlaste se Google účtem
  3. Klikněte "Create API Key"
  4. Zkopírujte vygenerovaný klíč
- **Nastavení v Replitu**:
  1. Otevřete záložku "Secrets" (🔒) v levém panelu
  2. Klikněte "New Secret"
  3. **Key**: `GEMINI_API_KEY`
  4. **Value**: Váš API klíč
  5. Klikněte "Add Secret"

## Volitelné SECRETS (automaticky generované)

### ADMIN_EMAIL
- **Popis**: E-mail pro admin účet
- **Automatické**: Vygeneruje se jako `{REPL_OWNER}@admin.local`
- **Ruční nastavení**: Můžete nastavit vlastní e-mail

### ADMIN_PASSWORD
- **Popis**: Heslo pro admin účet
- **Automatické**: Vygeneruje se náhodné 16-znakové heslo
- **Zobrazení**: Heslo se zobrazí v konzoli při prvním spuštění

### JWT_SECRET
- **Popis**: Tajný klíč pro JWT tokeny
- **Automatické**: Vygeneruje se náhodný 64-znakový řetězec

## Postup nastavení

1. **Remixněte projekt** na Replit
2. **Spusťte aplikaci** - automaticky se zkontrolují SECRETS
3. **Pokud chybí povinné SECRETS**, aplikace se nezapustí a zobrazí návod
4. **Nastavte chybějící SECRETS** podle pokynů
5. **Restartujte aplikaci** (Stop → Run)

## Kontrola stavu SECRETS

Stav SECRETS můžete zkontrolovat na:
- **Health check endpoint**: `/api/health`
- **Konzole serveru**: Při spuštění se zobrazí stav všech SECRETS

## Bezpečnost

- **Nikdy nesdílejte** své API klíče
- **SECRETS jsou skryté** v Replit prostředí
- **Automaticky generované hodnoty** jsou bezpečné pro produkční použití

## Řešení problémů

### Aplikace se nespustí
- Zkontrolujte, zda máte nastavený `GEMINI_API_KEY`
- Restartujte aplikaci po přidání SECRETS

### Admin přístup nefunguje
- Zkontrolujte vygenerované heslo v konzoli
- Použijte e-mail z `ADMIN_EMAIL` SECRETS

### API nefunguje
- Ověřte platnost `GEMINI_API_KEY`
- Zkontrolujte kvóty v Google AI Studio
