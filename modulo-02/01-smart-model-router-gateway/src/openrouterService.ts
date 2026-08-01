import { type ChatGenerationParams } from "@openrouter/sdk/models";
import { config, type ModelConfig } from "./config.ts";
import { OpenRouter }  from "@openrouter/sdk";

export type LLMResponse = {
    model: string;
    answer: string;
}

export class OpenRouterService {

    private config: ModelConfig;
    private client: OpenRouter;

    constructor(configOverride?: ModelConfig) {
        this.config = configOverride ?? config;

        this.client = new OpenRouter({
            apiKey: this.config.apiKey,
            httpReferer: this.config.httpReferer,
            xTitle: this.config.xTitle
        });
    }

    async generate(prompt: string): Promise<LLMResponse> {

        const response = await this.client.chat.send({
            models: this.config.models,
            messages: [
                {
                    role: 'system',
                    content: this.config.systemPrompt ?? 'You are a helpful assistant.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            stream: false,
            temperature: this.config.temperature ?? 0.2,
            maxTokens: this.config.maxTokens ?? 50,
            provider: this.config.provider as ChatGenerationParams["provider"]
        })

        const answer = String(response.choices.at(0)?.message.content ?? 'No answer generated.');

        return {
            model: response.model,
            answer
        }
    }

}