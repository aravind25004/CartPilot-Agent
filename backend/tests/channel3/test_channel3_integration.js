
import { Channel3Integration } from
    "../../src/integrations/channel3.js";

const channel3 = new Channel3Integration();

try {
    console.log("=== SEARCH PRODUCTS ===");

    const search = await channel3.searchProducts(
        "Sony WH-CH720N wireless noise-cancelling headphones"
    );

    const products = search.products ?? [];

    console.log("Products found:", products.length);
    console.log("Response timestamp:", search.as_of);

    console.table(
        products.map((product) => ({
            id: product.id,
            title: product.title,
            brand: product.brands?.[0]?.name,
            offers: product.offers?.length ?? 0,
        }))
    );

    if (products.length > 0) {
        console.log("\n=== GET PRODUCT DETAILS ===");

        const details = await channel3.getProducts([
            products[0].id,
        ]);

        const product = details.products?.[0];

        console.log(
            JSON.stringify(
                {
                    id: product?.id,
                    title: product?.title,
                    features: product?.key_features,
                    attributes: product?.structured_attributes,
                    offers: product?.offers?.map((offer) => ({
                        merchant: offer.domain,
                        price: offer.price,
                        availability: offer.availability,
                        condition: offer.condition,
                    })),
                    as_of: details.as_of,
                },
                null,
                2
            )
        );
    }
} catch (error) {
    console.error("Channel3 integration test failed:", error.message);
    process.exitCode = 1;
} finally {
    await channel3.close().catch(() => { });
}
