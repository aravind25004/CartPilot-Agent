
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { Channel3Integration } from "../integrations/channel3.js";
import { verifyProduct } from "../services/verification.js";

const router = Router();

// Development-only in-memory sessions.
// Each session owns its own Channel3 client and thread ID.
const sessions = new Map();

function getSession(sessionId) {
    if (typeof sessionId !== "string" || !sessionId.trim()) {
        return null;
    }

    return sessions.get(sessionId) ?? null;
}

// POST /api/products/search
router.post("/search", async (req, res, next) => {
    try {
        const { query, sessionId: requestedSessionId } = req.body ?? {};

        if (typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                error: "A non-empty product query is required.",
            });
        }

        let sessionId = requestedSessionId;
        let session = sessionId ? getSession(sessionId) : null;

        if (sessionId && !session) {
            return res.status(404).json({
                error: "Shopping session not found. Start a new search.",
            });
        }

        if (!session) {
            sessionId = randomUUID();
            session = {
                channel3: new Channel3Integration(),
                busy: false,
            };
            sessions.set(sessionId, session);
        }

        // Prevent overlapping calls from racing to update the same thread ID.
        if (session.busy) {
            return res.status(409).json({
                error: "This shopping session is processing another request. Retry shortly.",
            });
        }

        session.busy = true;

        try {
            const data = await session.channel3.searchProducts(query.trim());

            return res.json({
                success: true,
                sessionId,
                query: query.trim(),
                products: data.products ?? [],
                metadata: {
                    as_of: data.as_of ?? null,
                    thread_id: data.thread_id ?? null,
                    session_id: data.session_id ?? null,
                    next_page_token: data.next_page_token ?? null,
                },
            });
        } finally {
            session.busy = false;
        }
    } catch (error) {
        next(error);
    }
});

// POST /api/products/details
router.post("/details", async (req, res, next) => {
    try {
        const { sessionId, productIds } = req.body ?? {};
        const session = getSession(sessionId);

        if (!session) {
            return res.status(404).json({
                error: "Valid sessionId required. Search for products first.",
            });
        }

        if (
            !Array.isArray(productIds) ||
            productIds.length < 1 ||
            productIds.length > 40 ||
            productIds.some(
                (id) => typeof id !== "string" || !id.trim()
            )
        ) {
            return res.status(400).json({
                error: "productIds must contain 1–40 non-empty product IDs or retailer URLs.",
            });
        }

        if (session.busy) {
            return res.status(409).json({
                error: "This shopping session is processing another request. Retry shortly.",
            });
        }

        session.busy = true;

        try {
            const data = await session.channel3.getProducts(
                productIds.map((id) => id.trim())
            );

            return res.json({
                success: true,
                sessionId,
                products: data.products ?? [],
                metadata: {
                    as_of: data.as_of ?? null,
                    thread_id: data.thread_id ?? null,
                    session_id: data.session_id ?? null,
                },
            });
        } finally {
            session.busy = false;
        }
    } catch (error) {
        next(error);
    }
});


// POST /api/products/verify
router.post("/verify", async (req, res, next) => {
    try {
        const { sessionId, productId, requirements } = req.body ?? {};
        const session = getSession(sessionId);

        if (!session) {
            return res.status(404).json({
                error: "Valid sessionId required. Search for products first.",
            });
        }

        if (typeof productId !== "string" || !productId.trim()) {
            return res.status(400).json({
                error: "A productId is required.",
            });
        }

        if (
            !requirements ||
            typeof requirements !== "object" ||
            Array.isArray(requirements)
        ) {
            return res.status(400).json({
                error: "A requirements object is required.",
            });
        }

        if (
            requirements.requiredFeatures != null &&
            (!Array.isArray(requirements.requiredFeatures) ||
                requirements.requiredFeatures.some(
                    (feature) => typeof feature !== "string" || !feature.trim()
                ))
        ) {
            return res.status(400).json({
                error: "requiredFeatures must be an array of non-empty strings.",
            });
        }

        if (
            requirements.maxPrice != null &&
            (typeof requirements.maxPrice !== "number" ||
                !Number.isFinite(requirements.maxPrice) ||
                requirements.maxPrice < 0)
        ) {
            return res.status(400).json({
                error: "maxPrice must be a non-negative number.",
            });
        }

        if (
            requirements.minBatteryHours != null &&
            (typeof requirements.minBatteryHours !== "number" ||
                !Number.isFinite(requirements.minBatteryHours) ||
                requirements.minBatteryHours < 0)
        ) {
            return res.status(400).json({
                error: "minBatteryHours must be a non-negative number.",
            });
        }

        if (requirements.maxPrice != null &&
            (typeof requirements.currency !== "string" ||
                !/^[A-Z]{3}$/.test(requirements.currency))) {
            return res.status(400).json({
                error: "Provide a three-letter uppercase currency when maxPrice is set, e.g. USD.",
            });
        }

        if (session.busy) {
            return res.status(409).json({
                error: "This shopping session is processing another request. Retry shortly.",
            });
        }

        session.busy = true;

        try {
            const data = await session.channel3.getProducts([productId.trim()]);
            const product = (data.products ?? []).find(
                (item) => item.id === productId.trim()
            );

            if (!product) {
                return res.status(404).json({
                    error: "Product details were not returned for this product ID.",
                });
            }

            const reports = (product.offers ?? []).map((offer) =>
                verifyProduct(product, offer, requirements)
            );

            return res.json({
                success: true,
                sessionId,
                product: {
                    id: product.id,
                    title: product.title,
                    brands: product.brands ?? [],
                },
                checkedAt: new Date().toISOString(),
                sourceTimestamp: data.as_of ?? null,
                reports,
                summary: {
                    offersChecked: reports.length,
                    pass: reports.filter((r) => r.overallStatus === "PASS").length,
                    fail: reports.filter((r) => r.overallStatus === "FAIL").length,
                    unknown: reports.filter((r) => r.overallStatus === "UNKNOWN").length,
                },
            });
        } finally {
            session.busy = false;
        }
    } catch (error) {
        next(error);
    }
});


export default router;
