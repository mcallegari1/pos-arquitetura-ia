import config from '../../config.ts';
import { Neo4jService } from '../../services/neo4jService.ts';
import type { GraphState } from '../graph.ts';

async function executeQuery(query: string, neo4jService: Neo4jService) {

  try {

    const isValid = await neo4jService.validateQuery(query);
    if (!isValid) {
      return {
        results: null,
        error: 'Invalid query',
      };
    }

    const results = await neo4jService.query(query);
    if (!results.length) {
      return {
        results: [],
        error: 'No results found',
      }
    }

    return {
      results,
      error: null,
    };
  } catch (error: any) {
    console.error('Error executing query:', error instanceof Error ? error.message : error);
    return {
      results: null,
      error: error?.message ?? 'Unknown error occurred while executing the query',
    };
  }
}

function hasMoreSteps(state: GraphState): boolean {
  if (!state.isMultiStep || !state.subQuestions?.length || state.currentStep === undefined) {
    return false;
  }

  return true;
}

function handleMultiStepProgression(state: GraphState, results: any[]): Partial<GraphState> {
  
  const updatedResults = [...(state.subResults ?? []), results];

  const nextStep = (state.currentStep ?? 0) + 1;
  const multiStepState = {
    dbResults: results,
    subResults: updatedResults,
    currentStep: nextStep,
    needsCorrection: false,
  }

  const totalSteps = state.subQuestions?.length ?? 0;
  console.log(`Total steps: ${totalSteps}, Current step: ${nextStep}`);

  if (hasMoreSteps({...state, ...multiStepState})) {
    return multiStepState;
  }

  return multiStepState;
}

export function createCypherExecutorNode(neo4jService: Neo4jService) {

  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {

      const { results, error} = await executeQuery(state.query!, neo4jService);

      if (error && results === null) {

        if ((state.correctionAttempts ?? 0) < config.maxCorrectionAttempts) {
          console.log('🔍 Will attempt to auto-correct query...');
          return {
            validationError: error,
            originalQuery: state.originalQuery ?? state.query,
            needsCorrection: true,
          }
        }

        return {
          ...state,
          error: 'Invalid Cypher query - correction failed',
        };
      }


      if (state.isMultiStep && state.subQuestions?.length && state.currentStep !== undefined) {
        const multiStepState = handleMultiStepProgression(state, results!)
        return {
          ...multiStepState,
        }
      }

      if (!results?.length) {
        return {
          dbResults: [],
          error: 'No results found'
        }
      }

      return {
        ...state,
        dbResults: results,
        needsCorrection: false,
      };
    } catch (error) {
      console.error('Error executing Cypher query:', error instanceof Error ? error.message : error);

      return {
        ...state,
        error: 'Invalid Cypher query - correction failed',
      };
    }

    }
  };
