# MEXC Trading Bot Setup

## Step 1: Get API Keys
1. Go to https://www.mexc.com → Login → Account → API Management
2. Create a new API key with **Spot Trading** permission
3. Save the **API Key** and **Secret Key**

## Step 2: Install Dependencies
```bash
cd C:\Users\moham\AppData\Local\Temp\opencode
npm install ccxt
```

## Step 3: Create Config
Create `mexc-config.json`:
```json
{
  "apiKey": "YOUR_API_KEY",
  "secret": "YOUR_SECRET_KEY"
}
```

## Step 4: Run the Bot
```bash
node C:\Users\moham\AppData\Local\Temp\opencode\mexc-bot.js
```
