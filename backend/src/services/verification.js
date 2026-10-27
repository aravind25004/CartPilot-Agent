
const normalize = (value) =>
    String(value ?? "").toLowerCase().trim();

function makeCheck(status, requirement, evidence, reason) {
    return { status, requirement, evidence, reason };
}

function getProductText(product) {
    return [
        product.title,
        product.description,
        ...(product.key_features ?? []),
        ...Object.entries(product.structured_attributes ?? {})
            .flatMap(([key, values]) => [
                key,
                ...(Array.isArray(values) ? values : [values]),
            ]),
    ]
        .filter(Boolean)
        .join(" ");
}

function findBatteryHours(product) {
    const sources = [
        product.description,
        ...(product.key_features ?? []),
        ...(product.structured_attributes?.["battery-life"] ?? []),
        ...(product.structured_attributes?.["battery-life-hours"] ?? []),
    ];

    for (const source of sources) {
        const match = String(source ?? "").match(
            /(?:up to\s*)?(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr)\b/i
        );

        if (match) return Number(match[1]);
    }

    return null;
}

export function verifyProduct(product, offer, requirements = {}) {
    const checks = [];
    const productText = getProductText(product);
    const normalizedText = normalize(productText);

    // Brand
    if (requirements.brand) {
        const brands = (product.brands ?? [])
            .map((brand) => brand?.name)
            .filter(Boolean);

        const matched = brands.some(
            (brand) => normalize(brand) === normalize(requirements.brand)
        );

        checks.push(
            makeCheck(
                matched ? "PASS" : brands.length ? "FAIL" : "UNKNOWN",
                `Brand is ${requirements.brand}`,
                { field: "brands", value: brands },
                matched
                    ? "The product brand matches the requested brand."
                    : brands.length
                        ? "The available brand data does not match the requested brand."
                        : "Brand information is missing."
            )
        );
    }

    // Required features: text evidence only, not independent verification.
    for (const feature of requirements.requiredFeatures ?? []) {
        const matched = normalizedText.includes(normalize(feature));

        checks.push(
            makeCheck(
                matched ? "PASS" : "UNKNOWN",
                `Feature: ${feature}`,
                {
                    field: "description/key_features/structured_attributes",
                    value: matched ? feature : null,
                },
                matched
                    ? "Matching text was found in the product data; this does not independently confirm the specification."
                    : "No matching evidence was found. This does not prove the feature is absent."
            )
        );
    }

    // Minimum battery life
    if (requirements.minBatteryHours != null) {
        const hours = findBatteryHours(product);

        const status =
            hours == null
                ? "UNKNOWN"
                : hours >= requirements.minBatteryHours
                    ? "PASS"
                    : "FAIL";

        checks.push(
            makeCheck(
                status,
                `Battery life >= ${requirements.minBatteryHours} hours`,
                { field: "description/key_features/battery attributes", value: hours },
                hours == null
                    ? "A usable battery-life value was not found."
                    : status === "PASS"
                        ? `Product data states ${hours} hours.`
                        : `Product data states ${hours} hours, below the requested minimum.`
            )
        );
    }

    // Condition
    if (requirements.condition) {
        const actual = offer.condition;
        const status =
            !actual
                ? "UNKNOWN"
                : normalize(actual) === normalize(requirements.condition)
                    ? "PASS"
                    : "FAIL";

        checks.push(
            makeCheck(
                status,
                `Condition is ${requirements.condition}`,
                { field: "offer.condition", value: actual ?? null },
                status === "PASS"
                    ? "Offer condition matches."
                    : status === "FAIL"
                        ? "Offer condition does not match."
                        : "The offer does not specify its condition."
            )
        );
    }

    // Price and currency
    if (requirements.maxPrice != null) {
        const price = offer.price?.price;
        const actualCurrency = offer.price?.currency;
        const expectedCurrency = requirements.currency;

        let status = "UNKNOWN";
        let reason = "Price or currency is missing or invalid.";

        if (
            typeof price === "number" &&
            Number.isFinite(price) &&
            price >= 0 &&
            actualCurrency &&
            expectedCurrency
        ) {
            if (actualCurrency !== expectedCurrency) {
                reason =
                    `Currency mismatch: offer is ${actualCurrency}; ` +
                    `budget is ${expectedCurrency}. No conversion was applied.`;
            } else {
                status = price <= requirements.maxPrice ? "PASS" : "FAIL";
                reason =
                    status === "PASS"
                        ? "Offer price is within budget."
                        : "Offer price exceeds budget.";
            }
        }

        checks.push(
            makeCheck(
                status,
                `Price <= ${requirements.maxPrice} ${expectedCurrency ?? "(currency unspecified)"}`,
                {
                    field: "offer.price",
                    value: price ?? null,
                    currency: actualCurrency ?? null,
                },
                reason
            )
        );
    }

    // Availability
    if (requirements.requireInStock) {
        const actual = normalize(offer.availability);

        const status =
            actual === "instock"
                ? "PASS"
                : actual === "outofstock"
                    ? "FAIL"
                    : "UNKNOWN";

        checks.push(
            makeCheck(
                status,
                "Offer is in stock",
                { field: "offer.availability", value: offer.availability ?? null },
                status === "PASS"
                    ? "The offer reports in-stock availability."
                    : status === "FAIL"
                        ? "The offer reports that it is out of stock."
                        : "Availability is missing or unrecognized."
            )
        );
    }

    const statuses = checks.map((check) => check.status);

    const overallStatus = statuses.includes("FAIL")
        ? "FAIL"
        : statuses.includes("UNKNOWN")
            ? "UNKNOWN"
            : "PASS";

    return {
        productId: product.id ?? null,
        productTitle: product.title ?? null,
        merchant: offer.domain ?? null,
        offerUrl: offer.url ?? null,
        price: offer.price ?? null,
        availability: offer.availability ?? null,
        condition: offer.condition ?? null,
        checkedAt: new Date().toISOString(),
        overallStatus,
        checks,
        warnings: [
            "Product text matching is preliminary evidence, not independent manufacturer verification.",
            "Shipping, taxes, final checkout price, and regional availability are not verified.",
        ],
    };
}
