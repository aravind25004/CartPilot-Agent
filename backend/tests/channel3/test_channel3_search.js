
import "dotenv/config";
import {
    Client,
    StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

const SERVER_URL = process.env.CHANNEL3_MCP_URL;
const API_KEY = process.env.CHANNEL3_API_KEY?.trim();

if (!SERVER_URL) {
    throw new Error("Missing CHANNEL3_MCP_URL in backend/.env");
}

const client = new Client({
    name: "cartpilot-channel3-search-test",
    version: "1.0.0",
});

const headers = API_KEY
    ? { Authorization: `Bearer ${API_KEY}` }
    : {};

const transport = new StreamableHTTPClientTransport(
    new URL(SERVER_URL),
    {
        requestInit: { headers },
    }
);

async function main() {
    try {
        console.log("Connecting to Channel3 MCP...");
        await client.connect(transport);

        const query = "Sony wireless noise-cancelling headphones under ₹15000";

        console.log("\n=== SEARCH REQUEST ===");
        console.log("Tool: search_products");
        console.log("Query:", query);
        console.log("API key configured:", Boolean(API_KEY));

        const result = await client.callTool({
            name: "search_products",
            arguments: { query },
        });

        console.log("\n=== SEARCH RESPONSE ===");
        console.log("Is error:", result.isError ?? false);

        for (const item of result.content ?? []) {
            if (item.type === "text") {
                try {
                    // Parse JSON when the MCP result contains JSON text.
                    console.log(JSON.stringify(JSON.parse(item.text), null, 2));
                } catch {
                    console.log(item.text);
                }
            } else {
                console.log("Non-text content:", item.type);
            }
        }

        if (result.structuredContent) {
            console.log("\n=== STRUCTURED CONTENT ===");
            console.log(
                JSON.stringify(result.structuredContent, null, 2)
            );
        }

        console.log("\nSearch test completed.");
        console.log(
            "Next: inspect product IDs, offers, prices, and thread_id."
        );
    } catch (error) {
        console.error("\nChannel3 product-search test failed:");
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await client.close().catch(() => { });
    }
}

main();
