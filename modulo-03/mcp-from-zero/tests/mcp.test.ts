import { describe, it, after, before } from 'node:test';
import assert from 'node:assert';
import { Client } from '@modelcontextprotocol/sdk/client';
import { createTestClient } from './helpers.ts';

async function encryptMessage(client: Client, message: string, key: string) {
    
    const result = await client.callTool({
        name: 'encrypt_message',
        arguments: {
            message,
            key,
        },
    });

    return result as unknown as { structuredContent: { encryptedMessage: string } };
}

async function decryptMessage(client: Client, encryptedMessage: string, key: string) {
    
    const result = await client.callTool({
        name: 'decrypt_message',
        arguments: {
            encryptedMessage,
            key,
        },
    });

    return result as unknown as { structuredContent: { decryptedMessage: string } };
}


describe('MCP Tool Tests', () => {
    let client: Client;
    let encryptionKey: string = 'my-secret-passphrase';
    before(async () => {
        client = await createTestClient();
    });

    after(async () => {
        await client.close()
    });

    it('should encrypt a message', async () => {
        const myMessage = "Hello, World!";
        const encryptedMessage = await encryptMessage(client, myMessage, encryptionKey);
        
        console.log("Encrypted message:", encryptedMessage);
        assert.ok(
            encryptedMessage.structuredContent?.encryptedMessage.length > 60,
            "Encrypted message should not be empty"
        );
    });

    it('should decrypt a message', async () => {
        const myMessage = "Chove chuva";
        const key = 'test2-key';
        const { structuredContent: { encryptedMessage } } = await encryptMessage(client, myMessage, key);

        const decryptedMessage = await decryptMessage(client, encryptedMessage, key);

        assert.deepStrictEqual(
            decryptedMessage.structuredContent?.decryptedMessage,
            myMessage,
            "Decrypted message should match the original message",
        );
    });

    it('should list the encryption://info resource', async () => {
        const { resources } = await client.listResources();
        const info = resources.find(item => item.uri === 'encryption://info');
        assert.ok(info, "encryption://info resource should be listed");
    });
});