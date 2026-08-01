console.assert(process.env.OPENROUTER_API_KEY, "OPENROUTER_API_KEY is not defined in .env file");

export type ModelConfig = {
    apiKey: string|undefined;
    httpReferer: string;
    xTitle: string;
    port: number;
    models: string[];
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;

    provider: {
        sort: {
            by: string;
            partition: string;
        }
    }
};

export const config: ModelConfig = {
    apiKey: process.env.OPENROUTER_API_KEY,
    httpReferer: 'http://example.com',
    xTitle: 'SmartModelRouterGateway',
    port: 3000,
    models: [
        'inclusionai/ling-3.0-flash:free',
        'openai/gpt-oss-20b:free',
        'poolside/laguna-s-2.1:free'
    ],
    temperature: 0.2,
    maxTokens: 250,
    systemPrompt: 'You are a helpful assistant.',
    provider: {
        sort: {
            by: 'price',
            partition: 'none'
        }
    }
};
