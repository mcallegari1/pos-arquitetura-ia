import { describe, it, after, before } from 'node:test'
import assert from 'node:assert'
import { createTestClient } from '../helpers.ts'
import { Client } from '@modelcontextprotocol/sdk/client'

describe('Customer Prompts', async () => {
  let client: Client

  before(async () => {
    client = await createTestClient()
  })

  after(async () => {
    await client.close()
  })

  it('should return the find_customer_prompt', async () => {
    const result = await client.getPrompt({
      name: 'find_customer_prompt',
      arguments: { name: 'John' },
    })
    const text = result.messages[0].content
    assert.ok('text' in text && text.text.includes('get_customer'), 'Prompt should reference the get_customer tool')
    assert.ok('text' in text && text.text.includes('John'), 'Prompt should include the query')
  })

  it('should return the create_customer_prompt', async () => {
    const result = await client.getPrompt({
      name: 'create_customer_prompt',
      arguments: { name: 'John', phone: '555-0100' },
    })
    const text = result.messages[0].content
    assert.ok('text' in text && text.text.includes('create_customer'), 'Prompt should reference the create_customer tool')
    assert.ok('text' in text && text.text.includes('John'), 'Prompt should include the customer name')
  })

  it('should return the update_customer_prompt', async () => {
    const result = await client.getPrompt({
      name: 'update_customer_prompt',
      arguments: { _id: 'customer-id', phone: '555-0100' },
    })
    const text = result.messages[0].content
    assert.ok('text' in text && text.text.includes('update_customer'), 'Prompt should reference the update_customer tool')
    assert.ok('text' in text && text.text.includes('customer-id'), 'Prompt should include the customer id')
  })

  it('should return the delete_customer_prompt', async () => {
    const result = await client.getPrompt({
      name: 'delete_customer_prompt',
      arguments: { _id: 'customer-id' },
    })
    const text = result.messages[0].content
    assert.ok('text' in text && text.text.includes('delete_customer'), 'Prompt should reference the delete_customer tool')
    assert.ok('text' in text && text.text.includes('customer-id'), 'Prompt should include the customer id')
  })
})
