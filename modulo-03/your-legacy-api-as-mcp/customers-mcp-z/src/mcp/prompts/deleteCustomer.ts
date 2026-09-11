import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

export function registerDeleteCustomerPrompt(server: McpServer) {
    server.registerPrompt(
        "delete_customer_prompt",
        {
            description: "Prompt to delete a customer by their _id",
            argsSchema: {
                _id: z.string().describe("MongoDB ObjectId of the customer to delete")
            }
        },
        ({ _id }) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Please delete the customer using the delete_customer tool.\nCustomer _id: ${_id}`,
                    }
                }
            ]
        })
    )
}