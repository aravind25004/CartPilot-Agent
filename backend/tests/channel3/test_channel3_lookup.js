
import "dotenv/config";
import {
    Client,
    StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

const SERVER_URL = process.env.CHANNEL3_MCP_URL;
const API_KEY = process.env.CHANNEL3_API_KEY?.trim();
const THREAD_ID = process.env.CHANNEL3_TEST_THREAD_ID;

if (!SERVER_URL) {
    throw new Error("Missing CHANNEL3_MCP_URL in backend/.env");
}

if (!THREAD_ID) {
    throw new Error("Missing CHANNEL3_TEST_THREAD_ID in backend/.env");
}

const client = new Client({
    name: "cartpilot-channel3-lookup-test",
    version: "1.0.0",
});

const headers = API_KEY
    ? { Authorization: `Bearer ${API_KEY}` }
    : {};

const transport = new StreamableHTTPClientTransport(
    new URL(SERVER_URL),
    { requestInit: { headers } }
);

async function main() {
    try {
        console.log("Connecting to Channel3 MCP...");
        await client.connect(transport);

        const result = await client.callTool({
            name: "get_products",
            arguments: {
                product_ids: ["Oneo8oD", "vv8ymEu"],
                thread_id: THREAD_ID,
            },
        });

        console.log("\n=== GET PRODUCTS RESPONSE ===");
        console.log("Is error:", result.isError ?? false);

        for (const item of result.content ?? []) {
            if (item.type !== "text") {
                console.log("Non-text content:", item.type);
                continue;
            }

            try {
                console.log(JSON.stringify(JSON.parse(item.text), null, 2));
            } catch {
                console.log(item.text);
            }
        }

        if (result.structuredContent) {
            console.log("\n=== STRUCTURED CONTENT ===");
            console.log(
                JSON.stringify(result.structuredContent, null, 2)
            );
        }

        console.log("\nProduct lookup test completed.");
    } catch (error) {
        console.error("Channel3 product lookup failed:");
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await client.close().catch(() => { });
    }
}

main();
