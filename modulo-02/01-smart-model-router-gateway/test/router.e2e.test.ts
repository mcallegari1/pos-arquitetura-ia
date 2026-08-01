import test from 'node:test';
import assert from 'node:assert';
import { createServer } from '../src/server.ts';
import { config, type ModelConfig } from '../src/config.ts';
import { type LLMResponse, OpenRouterService } from '../src/openrouterService.ts';

console.assert(process.env.OPENROUTER_API_KEY, "OPENROUTER_API_KEY is not defined in .env file");

test.todo('Teste do mais barato', async (t) => {
 
    const customConfig: ModelConfig = {
        ...config,
        provider: {
            ...config.provider,
            sort: {
                ...config.provider.sort,
                by: 'price'
            }
        }
    }    

    const routerService = new OpenRouterService(customConfig);
    const app = createServer(routerService);

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: { question: 'Tell me 3 skateboarding tricks' }
    });

    assert.equal(response.statusCode, 200);
    const body = response.json() as LLMResponse;

    //console.log(body);
    // verifica se o modelo retornado é o esperado para o mais barato
    assert.equal(body.model, 'inclusionai/ling-3.0-flash:free');
})

test.todo('Teste da menor latencia', async (t) => {
 
    const customConfig: ModelConfig = {
        ...config,
        provider: {
            ...config.provider,
            sort: {
                ...config.provider.sort,
                by: 'latency'
            }
        }
    }    

    const routerService = new OpenRouterService(customConfig);
    const app = createServer(routerService);

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: { question: 'Tell me 3 skateboarding tricks' }
    });

    assert.equal(response.statusCode, 200);
    const body = response.json() as LLMResponse;

    //console.log(body);
    // verifica se o modelo retornado é o esperado para a menor latência
    assert.equal(body.model, 'poolside/laguna-s-2.1:free');
})

