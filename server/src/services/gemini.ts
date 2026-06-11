import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiResult {
  output: string;
  model: string;
  tokenUsage: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export const executeGeminiAction = async (
  promptText: string,
  userApiKey?: string,
  systemInstruction?: string,
  modelName: string = 'gemini-2.5-flash',
  taskPreset?: 'summarize' | 'generate' | 'translate' | 'sentiment' | 'keywords'
): Promise<GeminiResult> => {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('Gemini API Key is missing. Triggering Mock AI simulation...');
    return generateMockGeminiResponse(promptText, systemInstruction, modelName, taskPreset);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 1. Resolve System Instructions based on task preset OR custom input
    let finalSystemInstruction = systemInstruction || '';
    if (taskPreset) {
      switch (taskPreset) {
        case 'summarize':
          finalSystemInstruction = 'You are an expert content summarizer. Provide a concise, professional summary of the text below. Highlight key points. Keep it under 150 words.';
          break;
        case 'translate':
          finalSystemInstruction = 'You are a professional translator. Translate the text below to English. Respond ONLY with the translation.';
          break;
        case 'sentiment':
          finalSystemInstruction = 'Analyze the sentiment of the text. Respond with exactly one word: POSITIVE, NEGATIVE, or NEUTRAL, followed by a brief 1-sentence explanation.';
          break;
        case 'keywords':
          finalSystemInstruction = 'Extract the top 5 key entities or topics from the text below as a comma-separated list. Respond ONLY with the list.';
          break;
        case 'generate':
        default:
          finalSystemInstruction = 'You are a helpful creative writing assistant. Respond appropriately to the user prompt.';
          break;
      }
    }

    // 2. Initialize Gemini Model with System Instruction parameters
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: finalSystemInstruction || undefined,
    });

    console.log(`Executing Gemini API call using model: ${modelName}`);
    
    // 3. Generate content
    const result = await model.generateContent(promptText);
    const response = await result.response;
    const text = response.text().trim();

    // 4. Retrieve Token Usage Metadata from response
    const usageMetadata = response.usageMetadata;
    const promptTokens = usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = usageMetadata?.totalTokenCount || 0;

    return {
      output: text,
      model: modelName,
      tokenUsage: {
        promptTokens,
        candidatesTokens,
        totalTokens,
      },
    };
  } catch (error: any) {
    console.error('Gemini Service Exception:', error);
    throw new Error(`Gemini API call failed: ${error.message}`);
  }
};

const generateMockGeminiResponse = (
  promptText: string,
  systemInstruction?: string,
  modelName: string = 'gemini-2.5-flash',
  taskPreset?: string
): GeminiResult => {
  const cleaned = promptText.trim();
  let text = '';
  
  if (taskPreset) {
    switch (taskPreset) {
      case 'summarize':
        text = `[Mock Summary - ${modelName}] Summarized text of length ${cleaned.length}: "${cleaned.substring(0, 60)}..." focusing on central automation objectives.`;
        break;
      case 'translate':
        text = `[Mock Translation - ${modelName}] Translated: "${cleaned}"`;
        break;
      case 'sentiment':
        text = cleaned.toLowerCase().includes('bad') ? 'NEGATIVE' : 'POSITIVE';
        break;
      case 'keywords':
        text = 'automation, flowgenius, integrations, trigger, action';
        break;
      case 'generate':
      default:
        text = `[Mock Content - ${modelName}] Response to: "${cleaned}"`;
        break;
    }
  } else {
    text = `[Mock Model Response - ${modelName}]\nSystem Instruction: "${systemInstruction || 'None'}"\nUser Prompt: "${cleaned}"\n\nAutomated workflow step processed successfully.`;
  }

  // Generate simulated token metrics
  const promptTokens = Math.round(cleaned.length / 4) + 10;
  const candidatesTokens = Math.round(text.length / 4) + 5;

  return {
    output: text,
    model: modelName,
    tokenUsage: {
      promptTokens,
      candidatesTokens,
      totalTokens: promptTokens + candidatesTokens,
    },
  };
};
