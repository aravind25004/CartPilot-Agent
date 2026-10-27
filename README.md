# CartPilot AI

## 1. Project Overview

CartPilot AI is an AI-powered shopping assurance agent designed to help users evaluate products before purchasing. It researches product listings, checks requirements against available evidence, compares offers, and supports a safer purchase workflow.

The core goal is to **verify before buying** by identifying missing information, inconsistencies, and potential risks before proceeding to checkout.

---

## 2. Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | User interface |
| **Backend** | Node.js + Express | API and application logic |
| **AI Agent** | Vercel AI SDK | Agent orchestration and tool calling |
| **Product Discovery** | Channel3 MCP | Product search and detailed product information |
| **Payment** | PayPal Sandbox | Planned checkout and payment processing |
| **Database** | MongoDB Atlas | Planned session and verification data persistence |
| **Search / Evidence** | Elasticsearch | Planned evidence retrieval |

---

## 3. Channel3 Integration

Channel3 is integrated via the Model Context Protocol (MCP) to perform product discovery, offer comparison, and retrieval of detailed product attributes.

### 3.1 Endpoints and Tools Used
- **MCP Endpoint:** `https://mcp.trychannel3.com/` — Connects the backend to Channel3 using the Model Context Protocol (MCP).
- **`search_products`** — Discovers products based on natural-language search queries and returns product summaries, active offers, and a conversation `thread_id`.
- **`get_products`** — Retrieves detailed product information using product IDs or retailer URLs, including full descriptions, key features, structured attributes, and offers.

---

### 3.2 Response Metadata (Sample from `test_channel3_search.js`)

Below is a representative sample response returned by `search_products` during the Channel 3 search test:

```json
{
  "products": [
    {
      "id": "mWNyIx2",
      "title": "Sony WH-CH720N Noise cancelling Headphone Bluetooth with microphone",
      "brands": [
        {
          "id": "PURH",
          "name": "Sony"
        }
      ],
      "images": [
        {
          "url": "https://cdn.trychannel3.com/cleaned/v1/59d25805-a7ce-47ec-bf2e-ca4e9f5c881c?aid=01M5ZC5HTRF5Q5D4HDQ87HCSEE&mid=RnUy",
          "cleaned_url": "https://cdn.trychannel3.com/cleaned/v1/59d25805-a7ce-47ec-bf2e-ca4e9f5c881c?aid=01M5ZC5HTRF5Q5D4HDQ87HCSEE&mid=RnUy",
          "is_main_image": true,
          "shot_type": "hero",
          "alt_text": "Black Sony WH-CH720N wireless headphones on a white background."
        },
        {
          "url": "https://cdn.trychannel3.com/cleaned/v1/9bde5917-42c5-409f-b5a9-8c698139cfce?aid=01M5ZC5HTRF5Q5D4HDQ87HCSEE&mid=RnUy",
          "cleaned_url": "https://cdn.trychannel3.com/cleaned/v1/9bde5917-42c5-409f-b5a9-8c698139cfce?aid=01M5ZC5HTRF5Q5D4HDQ87HCSEE&mid=RnUy",
          "is_main_image": false,
          "shot_type": "hero",
          "alt_text": "White Sony WH-CH720N wireless headphones on a white background."
        }
      ],
      "offers": [
        {
          "url": "https://buy.trychannel3.com/mWNyIx2-RnUy-S666bu?o=01M31JFEVXQA238X32G5XMZN46&aid=01M5ZC5J6DFEY5558AKEQDSAZT",
          "domain": "beachcamera.com",
          "price": {
            "price": 75.99,
            "compare_at_price": 149.99,
            "currency": "USD"
          },
          "availability": "InStock",
          "condition": "used",
          "dimensions": {
            "length": null,
            "width": null,
            "height": null,
            "weight": {
              "number": 192,
              "unit": "g"
            }
          }
        },
        {
          "url": "https://buy.trychannel3.com/mWNyIx2-LPzf-S666bu?o=01M5938A219AWKKMXYECN0KBF8&aid=01M5ZC5J6DFEY5558AKEQDSAZT",
          "domain": "newegg.com",
          "price": {
            "price": 79.99,
            "compare_at_price": null,
            "currency": "USD"
          },
          "availability": "InStock",
          "condition": "new",
          "dimensions": null
        },
        {
          "url": "https://buy.trychannel3.com/mWNyIx2-CgP5-S666bu?o=01M2C4KKQYNGFHWSBNG2268XWV&aid=01M5ZC5J6DFEY5558AKEQDSAZT",
          "domain": "electronics.woot.com",
          "price": {
            "price": 84.99,
            "compare_at_price": null,
            "currency": "USD"
          },
          "availability": "InStock",
          "condition": null,
          "dimensions": null
        },
        {
          "url": "https://buy.trychannel3.com/mWNyIx2-n0yg-S666bu?o=01M38T7AG75ZFH5WVBRNVASJKS&aid=01M5ZC5J6DFEY5558AKEQDSAZT",
          "domain": "backmarket.com",
          "price": {
            "price": 86,
            "compare_at_price": 149,
            "currency": "USD"
          },
          "availability": "InStock",
          "condition": null,
          "dimensions": {
            "length": null,
            "width": null,
            "height": null,
            "weight": {
              "number": 8,
              "unit": "oz"
            }
          }
        },
        {
          "url": "https://buy.trychannel3.com/mWNyIx2-K6RA-S666bu?o=01M3T1KG3GK1DE29VZQ7E82TCK&aid=01M5ZC5J6DFEY5558AKEQDSAZT",
          "domain": "macys.com",
          "price": {
            "price": 178,
            "compare_at_price": null,
            "currency": "USD"
          },
          "availability": "InStock",
          "condition": "new",
          "dimensions": null
        }
      ]
    }
  ],
  "next_page_token": "eyJjYWNoZV9rZXkiOiAiYWdlbnRpY19zZWFyY2g6cG9vbDozN2M1ZTg5MzczMDMxMTZkIiwgIm9mZnNldCI6IDh9",
  "as_of": "2026-10-27T19:07:37.680Z",
  "session_id": "ses_01a17ec2-bb48-7435-80ae-e2b8c14de88e",
  "server_origin": "https://mcp.trychannel3.com",
  "thread_id": "thr_990e77d2-3e5e-4dd6-9d06-10faed936063",
  "seq": 2
}
```

---

### 3.3 What Needs to Be Preserved
- **Latest `thread_id`:** Pass the most recently returned thread ID (`thread_id`) to every subsequent Channel3 tool call to maintain conversational state and query context.
- **Raw Evidence & Source Metadata:** Retain product attributes, offer details, source timestamps (`as_of`), and retailer links (`url`/`domain`) so verification decisions can be traced back to original evidence.
- **Session Isolation:** Manage the MCP client and thread ID per shopping session rather than sharing mutable session state across users.

---

### 3.4 Important Findings
- **Discovery vs. Checkout Separation:** Channel3 is strictly used for product discovery and verification; PayPal Sandbox handles the payment workflow.
- **Responses Require Validation:** Fields like product titles, structured attributes, offer conditions, availability, and currencies can be absent or inconsistent across retailers—never rely on a single field without fallback handling.
- **Evidence Is Dynamic:** Online listings and pricing change frequently; initial search evidence does not guarantee checkout price, regional availability, shipping, or taxes.
