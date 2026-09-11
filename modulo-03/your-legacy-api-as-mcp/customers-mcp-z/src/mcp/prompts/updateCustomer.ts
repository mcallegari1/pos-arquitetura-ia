import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CustomerUpdateSchema } from "../../domain/customer.ts";

export function registerUpdateCustomerPrompt(server: McpServer) {
    server.registerPrompt(
        "update_customer_prompt",
        {
            description: "Prompt to update a customer's name and/or phone number",
            argsSchema: CustomerUpdateSchema.shape
        },
        (customer) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Please update the customer using the update_customer tool.\nCustomer: ${JSON.stringify(customer)}`,
                    }
                }
            ]
        })
    )
}