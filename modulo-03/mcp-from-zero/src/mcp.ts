import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { z } from "zod/v3";
import { decrypt, encrypt } from "./service.ts";
import { mime } from "zod/v4";

export const server = new McpServer({
    // The name of the server
    name: "@mcallegari/ciphersuite-mcp",
    version: "0.0.1",
});

server.registerTool(
    "encrypt_message",
    {
        description: "Encrypts a message using a passphrase",
        inputSchema: {
            message: z.string().describe("The message to encrypt"),
            key: z.string().describe("The passphrase to use for encryption")
        },
        outputSchema: {
            encryptedMessage: z.string().describe("The encrypted message")
        },
    }, 
    async ({ message, key }) => {

        try {

            const encryptedMessage = encrypt(message, key);
            return {
                content: [{
                    type: 'text',
                    text: encryptedMessage,
                }],
                structuredContent: {
                    encryptedMessage,
                }
            }


        } catch (error) {
            return {
                isError: true,
                content: [{
                    type: 'text',
                    text: `Error encrypting message: ${error instanceof Error ? error.message : String(error)}`,
                }]
            }
        }
    }
);

server.registerTool(
    "decrypt_message",
    {
        description: "Decrypts a message using a passphrase",
        inputSchema: {
            encryptedMessage: z.string().describe("The encrypted message to decrypt"),
            key: z.string().describe("The passphrase to use for decryption")
        },
        outputSchema: {
            decryptedMessage: z.string().describe("The decrypted message")
        },
    }, 
    async ({ encryptedMessage, key }) => {

        try {

            const decryptedMessage = decrypt(encryptedMessage, key);
            return {
                content: [{
                    type: 'text',
                    text: decryptedMessage,
                }],
                structuredContent: {
                    decryptedMessage,
                }
            }

        } catch (error) {
            return {
                isError: true,
                content: [{
                    type: 'text',
                    text: `Error decrypting message: ${error instanceof Error ? error.message : String(error)}`,
                }]
            }
        }
    }
);

server.registerResource(
    "encryption://info",
    "encryption://info",        
    {
        description: "Information about the encryption tool",
    },
    () => ({
        contents: [
            {
                uri: "encryption://info",
                mimeType: "text/plain",
                text: `This is a simple encryption tool that can encrypt and decrypt messages using a passphrase. It uses the AES-256-CBC algorithm for encryption and decryption. The tool is implemented as a Model Context Protocol (MCP) server, which allows it to be easily integrated into other applications that support MCP.
                `,
            }
        ]
    })
)