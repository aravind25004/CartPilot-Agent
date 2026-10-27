
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

/**
 * Create one Channel3 client per shopping session.
 * Keep this instance scoped to that session so its thread ID
 * is never accidentally shared between different users.
 */
export class Channel3Integration {
    #client;
    #transport;
    #connected = false;
    #threadId;

    constructor() {
        this.#client = new Client({
            name: "cartpilot-ai",
            version: "1.0.0",
        });

        const headers = API_KEY
            ? { Authorization: `Bearer ${API_KEY}` }
            : {};

        this.#transport = new StreamableHTTPClientTransport(
            new URL(SERVER_URL),
            { requestInit: { headers } }
        );
    }

    async connect() {
        if (this.#connected) return;

        await this.#client.connect(this.#transport);
        this.#connected = true;
    }

    async #callTool(name, args) {
        await this.connect();

        const result = await this.#client.callTool({
            name,
            arguments: {
                ...args,
                ...(this.#threadId
                    ? { thread_id: this.#threadId }
                    : {}),
            },
        });

        if (result.isError) {
            const message = (result.content ?? [])
                .filter((item) => item.type === "text")
                .map((item) => item.text)
                .join("\n");

            throw new Error(
                `Channel3 tool "${name}" failed: ${message || "Unknown error"}`
            );
        }

        let data = result.structuredContent;

        if (!data) {
            const textItems = (result.content ?? [])
                .filter((item) => item.type === "text")
                .map((item) => item.text);

            for (const text of textItems) {
                try {
                    data = JSON.parse(text);
                    break;
                } catch {
                    // Some tools return a human-readable summary before
                    // or instead of structured JSON.
                }
            }
        }

        if (!data || typeof data !== "object") {
            throw new Error(
                `Channel3 tool "${name}" returned no structured data`
            );
        }

        // Always retain the newest thread ID returned by Channel3.
        if (data.thread_id) {
            this.#threadId = data.thread_id;
        }

        return data;
    }

    async searchProducts(query) {
        if (typeof query !== "string" || !query.trim()) {
            throw new Error("A non-empty product query is required");
        }

        return this.#callTool("search_products", {
            query: query.trim(),
        });
    }

    async getProducts(productIds) {
        if (
            !Array.isArray(productIds) ||
            productIds.length < 1 ||
            productIds.length > 40 ||
            productIds.some(
                (id) => typeof id !== "string" || !id.trim()
            )
        ) {
            throw new Error(
                "productIds must contain between 1 and 40 non-empty IDs or URLs"
            );
        }

        return this.#callTool("get_products", {
            product_ids: productIds,
        });
    }

    async close() {
        if (!this.#connected) return;

        this.#connected = false;
        await this.#client.close();
    }
}
