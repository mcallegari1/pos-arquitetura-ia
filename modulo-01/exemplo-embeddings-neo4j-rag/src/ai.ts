import { ChatOpenAI } from "@langchain/openai";
import { type Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

type DebugLog = (...args: unknown[]) => void;
type params = {
    debugLog: DebugLog,
    neo4jVectorStore: Neo4jVectorStore,
    nlpModel: ChatOpenAI,
    promptConfig: any,
    templateText: string,
    topK: number
}

interface ChainState {
    question: string;
    context?: string;
    topScore?: number;
    error?: string;
    answer?: string;
}


export class AI {

    private params: params;
    constructor(params: params) {
        this.params = params;
    }

    async retrieveVectorSearchResults(input: ChainState): Promise<ChainState> {

        const vectorResults = await this.params.neo4jVectorStore.similaritySearchWithScore(input.question, this.params.topK);
        if (!vectorResults || vectorResults.length === 0) {
            return {
                ...input,
                error: "No results found for the given question."
            }
        }
        
        const topScore = vectorResults[0]![1];
        
        const context = vectorResults.filter(([_, score]) => score > topScore * 0.5)
            .map(([doc, _]) => doc.pageContent)
            .join("\n\n----\n\n");

        return {
            ...input,
            context: context,
            topScore
        }
    }

    async generateAnswer(input: ChainState): Promise<ChainState> {
        if (input.error) {
            return input;
        }

        const responsePrompt = ChatPromptTemplate.fromTemplate(this.params.templateText);

        const responseChain = responsePrompt
            .pipe(this.params.nlpModel)
            .pipe(new StringOutputParser());

        const rawResponse = await responseChain.invoke({
            role: this.params.promptConfig.role,
            task: this.params.promptConfig.task,
            tone: this.params.promptConfig.tone,
            language: this.params.promptConfig.language,
            format: this.params.promptConfig.format,
            instructions: this.params.promptConfig.instructions.map((instruction: string, index: number) => `${index + 1}. ${instruction}`).join("\n"),
            question: input.question,
            context: input.context
        });
        
        return {
            ...input,
            answer: rawResponse
        }
    }

    async answerQuestion(question: string): Promise<ChainState> {
     
        const chain = RunnableSequence.from([
            this.retrieveVectorSearchResults.bind(this),
            this.generateAnswer.bind(this)
        ])

        const result = await chain.invoke({question: question})
        this.params.debugLog("\n Pergunta:", question);
        this.params.debugLog("\n Resultado final:", result.answer || result.error || "No answer generated.");

        return result;
    }
}