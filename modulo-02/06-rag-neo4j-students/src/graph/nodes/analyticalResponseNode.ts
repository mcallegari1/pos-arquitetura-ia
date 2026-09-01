import { AIMessage } from 'langchain';
import { OpenRouterService } from '../../services/openrouterService.ts';
import type { GraphState } from '../graph.ts';
import { AnalyticalResponseSchema, getErrorResponsePrompt, getMultiStepSynthesisPrompt, getNoResultsPrompt, getSystemPrompt, getUserPromptTemplate } from '../../prompts/v1/analyticalResponse.ts';

async function handleSuccessResponse(state: GraphState, llmClient: OpenRouterService): Promise<Partial<GraphState>> {

  const systemPrompt = getSystemPrompt();
  let _userPrompt: string;

  if (Boolean(
    state.isMultiStep &&
    state.subResults?.length &&
    state.subQuestions?.length &&
    state.subQueries?.length
  )) {
    
    const stepData = state.subResults!.map((results, index) => ({
      stepNumber : index + 1,
      question: state.subQuestions![index],
      query: state.subQueries![index],
      results: JSON.stringify(results),
    }));

    _userPrompt = getMultiStepSynthesisPrompt(state.question!, stepData);
  } else {
    _userPrompt = getUserPromptTemplate(
      state.question!,
       state.query!,
       JSON.stringify(state.dbResults)
      );
  }

  const {data, error} = await llmClient.generateStructured(
    systemPrompt,
    _userPrompt,
    AnalyticalResponseSchema
  );

  if (error) {
    console.error('Error generating response:', error);
    return {
      error: `An error occurred while generating the response: ${error}`,
    }
  }

  return {
    messages: [new AIMessage(data!.answer)],
    answer: data?.answer,
    followUpQuestions: data?.followUpQuestions,
  }
}

async function handleNoResultsResponse(state: GraphState, llmClient: OpenRouterService): Promise<Partial<GraphState>> {

  const systemPrompt = getSystemPrompt();
  const userPrompt = getNoResultsPrompt(state.question ?? 'question', state.query ?? 'N/A');

  const {data, error} = await llmClient.generateStructured(
    systemPrompt,
    userPrompt,
    AnalyticalResponseSchema
  )

  if (data) {
    return {
      ...state,
      messages: [...state.messages, new AIMessage(data.answer)],
      answer: data.answer,
      followUpQuestions: data.followUpQuestions,
    };
  }

  const noResultsMessage = "No data found matching your query.";
  return {
    ...state,
    messages: [...state.messages, new AIMessage(noResultsMessage)],
    error,
    answer: noResultsMessage,
    followUpQuestions: [],
  };
}

async function handleErrorResponse(state: GraphState, llmClient: OpenRouterService): Promise<Partial<GraphState>> {

  const systemPrompt = getSystemPrompt();
  const userPrompt = getErrorResponsePrompt(state.error!, state.question!);
  const {data, error} = await llmClient.generateStructured(
    systemPrompt,
    userPrompt,
    AnalyticalResponseSchema
  );

  if (error) {
    return {
      messages: [new AIMessage('Error correcting query: ' + error)],
      error, 
      answer: `An error occurred while correcting the query: ${error}`,
      followUpQuestions: [],
    }
  }

  return {
    messages: [new AIMessage(data!.answer)],
    answer: data?.answer,
    followUpQuestions: data?.followUpQuestions,
  }
}

export function createAnalyticalResponseNode(llmClient: OpenRouterService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {

      if (state.error) {
        return await handleErrorResponse(state, llmClient)
      }

      if (!state.dbResults?.length) {
        return await handleNoResultsResponse(state, llmClient);
      }

      return await handleSuccessResponse(state, llmClient);

      return {
        ...state,
        messages: [new AIMessage('hello world')],
      }
    } catch (error: any) {
      console.error('Error generating analytical response:', error.message);
      return {
        ...state,
        error: `Response generation failed: ${error.message}`,
      };
    }
  };
}
