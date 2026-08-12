import { HumanMessage, RemoveMessage } from '@langchain/core/messages';
import { OpenRouterService } from '../../services/openrouterService.ts';
import type { GraphState } from '../graph.ts';
import { type ConversationSummary, getSummarizationSystemPrompt, getSummarizationUserPrompt, SummarySchema } from '../../prompts/v1/summarization.ts';
import { type Runtime } from '@langchain/langgraph';
import { PreferencesService } from '../../services/preferencesService.ts';

export function createSummarizationNode(llmClient: OpenRouterService, preferencesService: PreferencesService) {
    return async (state: GraphState, runtime: Runtime): Promise<Partial<GraphState>> => {

        const conversationHistory = state.messages.map(msg => ({role: HumanMessage.isInstance(msg) ? 'user' : 'assistant', content: msg.text}));

        const previousSummary = state.conversationSummary as ConversationSummary || undefined;

        const systemPrompt = getSummarizationSystemPrompt();

        const userPrompt = getSummarizationUserPrompt(conversationHistory, previousSummary);

        const result = await llmClient.generateStructured(userPrompt, systemPrompt, SummarySchema);

        if (!result.success || !result.data) {
            console.error('Failed to generate structured response:', result.error);
            return {
                needsSummarization: false,
            }

        }

        const userId = String(runtime?.context?.userId || state.userId || 'unknown_user');

        await preferencesService.storeSummary(userId, result.data);

        const deleteMessages = state.messages.slice(0, 2).map(msg => new RemoveMessage({id: msg.id as string}));

        return {
          messages: deleteMessages,
          conversationSummary: result.data,
          needsSummarization: false,
        };
    };
}
