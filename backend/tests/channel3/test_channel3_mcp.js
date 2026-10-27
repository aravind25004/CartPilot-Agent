
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const SERVER_URL = "https://mcp.trychannel3.com/";

const client = new Client({
    name: "cartpilot-channel3-test",
    version: "1.0.0",
});

const transport = new StreamableHTTPClientTransport(
    new URL(SERVER_URL)
);

async function main() {
    try {
        console.log("Connecting to Channel3 MCP...");
        await client.connect(transport);

        console.log("\n=== SERVER INFORMATION ===");
        console.log(JSON.stringify(client.getServerVersion(), null, 2));

        console.log("\n=== AVAILABLE TOOLS ===");
        const result = await client.listTools();

        for (const tool of result.tools ?? []) {
            console.log(
                JSON.stringify(
                    {
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema,
                    },
                    null,
                    2
                )
            );
        }

        console.log("\nTool discovery completed.");
        console.log("Next, we will call search_products using its actual schema.");
    } catch (error) {
        console.error("Channel3 MCP test failed:");
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await client.close().catch(() => { });
    }
}

main();
