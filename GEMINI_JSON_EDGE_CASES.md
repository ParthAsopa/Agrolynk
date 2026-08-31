# cleanGeminiJson() Edge Case Analysis

## Overview

The `cleanGeminiJson()` helper function attempts to extract JSON from Gemini's responses by:

1. Removing markdown code blocks (````json` and ``)
2. Finding the first `{` and last `}`
3. Extracting everything between them

**Location:** [server/routes.ts](server/routes.ts#L111)

**Used by:**

- `POST /api/ai/price` → expects `{ recommendedPrice, priceRange: { min, max }, reason }`
- `POST /api/ai/match` → expects `{ matchScore, reasons: [...], summary }`

---

## Current Protection: Try-Catch

Both routes wrap JSON.parse in a try-catch:

```typescript
try {
  recommendation = JSON.parse(cleanedResponse);
} catch (parseError) {
  console.error("Failed to parse Gemini price response:", parseError);
  return res
    .status(500)
    .json({ error: "Gemini returned an invalid JSON response" });
}
```

**This catches syntax errors but not semantic errors.**

---

## Identified Edge Cases

### ❌ CASE 1: Empty Response

**Input:** `""` or `"   "`
**cleanGeminiJson Output:** `""`
**Result:**

```typescript
JSON.parse(""); // Throws: SyntaxError: Unexpected end of JSON input
```

**Status:** ✅ CAUGHT by try-catch

---

### ❌ CASE 2: No Braces in Response

**Input:** `"Unable to process request. Please try again later."`
**cleanGeminiJson Logic:**

```typescript
const firstBrace = "Unable to process...".indexOf("{"); // -1
const lastBrace = "Unable to process...".lastIndexOf("}"); // -1
// Condition fails, returns original string
```

**Output:** `"Unable to process request. Please try again later."`
**Result:**

```typescript
JSON.parse("Unable to process request..."); // Throws: SyntaxError
```

**Status:** ✅ CAUGHT by try-catch

---

### ❌ CASE 3: Only Opening Brace, No Closing Brace

**Input:** `"{"` or `"Here's the response: {"`
**cleanGeminiJson Logic:**

```typescript
const firstBrace = cleaned.indexOf("{"); // 0 (or some position)
const lastBrace = cleaned.lastIndexOf("}"); // -1 (no closing brace)
// Condition lastBrace !== -1 fails, returns original string
```

**Output:** `"Here's the response: {"`
**Result:**

```typescript
JSON.parse("Here's the response: {"); // Throws: SyntaxError
```

**Status:** ✅ CAUGHT by try-catch

---

### ❌ CASE 4: Only Closing Brace, No Opening Brace

**Input:** `"}"`
**cleanGeminiJson Logic:**

```typescript
const firstBrace = "}".indexOf("{"); // -1
const lastBrace = "}".lastIndexOf("}"); // 0
// Both conditions required, fails because firstBrace is -1
```

**Output:** `"}"`
**Result:**

```typescript
JSON.parse("}"); // Throws: SyntaxError
```

**Status:** ✅ CAUGHT by try-catch

---

### ❌ CASE 5: Multiple Separate JSON Objects

**Input:**

```
Here are two prices:
{ "price": 100 }
{ "price": 200 }
```

**cleanGeminiJson Logic:**

```typescript
const firstBrace = 0; // First '{'
const lastBrace = lastIndexOf("}"); // Points to LAST '}'
cleaned = substring(0, index_of_last_}+1);
```

**Output:** `{ "price": 100 }\n{ "price": 200 }`
**Result:**

```typescript
JSON.parse('{ "price": 100 }\n{ "price": 200 }');
// Throws: SyntaxError: Unexpected token } in JSON at position 15
```

**Status:** ✅ CAUGHT by try-catch

---

### ⚠️ CASE 6: JSON Array Instead of Object

**Input:**

```json
[{ "matchScore": 94, "reasons": ["..."], "summary": "..." }]
```

**cleanGeminiJson Logic:**

- Looks for first `{` not first `[`
- Will extract `{"matchScore": 94, ...}` which is correct
  **Output:** Valid JSON object
  **Result:** ✅ Parses correctly (array stripped, inner object returned)
  **Status:** ⚠️ WORKS BUT FRAGILE

---

### ⚠️ CASE 7: JSON with Text Before/After

**Input:**

```
Based on my analysis:
{
  "recommendedPrice": 2500,
  "priceRange": {"min": 2400, "max": 2600},
  "reason": "Market rates are stable"
}
Let me know if you need anything else.
```

**cleanGeminiJson Logic:**

- First `{`: position of opening brace
- Last `}`: position of last closing brace
- Extract substring between them
  **Output:**

```json
{
  "recommendedPrice": 2500,
  "priceRange": { "min": 2400, "max": 2600 },
  "reason": "Market rates are stable"
}
```

**Result:** ✅ Parses correctly
**Status:** ✅ WORKS (as intended)

---

### 🚨 CASE 8: Malformed JSON with Trailing Comma

**Input:**

```json
{
  "recommendedPrice": 2500,
  "priceRange": {
    "min": 2400,
    "max": 2600
  }
}
```

**cleanGeminiJson Output:** Extracted substring (unchanged)
**Result:**

```typescript
JSON.parse(...) // Throws: SyntaxError: Unexpected token } in JSON at position XX
```

**Status:** ✅ CAUGHT by try-catch

---

### 🚨 CASE 9: Invalid JSON Literals (JavaScript != JSON)

**Input:**

```javascript
{
  "matchScore": undefined,
  "reasons": null,
  "summary": "Test"
}
```

**OR**

```javascript
{
  "recommendedPrice": NaN,
  "priceRange": {"min": Infinity, "max": -Infinity}
}
```

**cleanGeminiJson Output:** Unchanged
**Result:**

```typescript
JSON.parse(...) // Throws: SyntaxError: Unexpected token u/N/I in JSON
```

**Status:** ✅ CAUGHT by try-catch

---

### 🚨 CASE 10: Escaped Characters or Unicode Issues

**Input:**

```json
{
  "reason": "Price based on \"market trends\""
}
```

**cleanGeminiJson Output:** Extracted substring
**Result:**

```typescript
JSON.parse('{"reason": "Price based on \\"market trends\\""}');
// ✅ Valid JSON, backslashes properly escape quotes
```

**Status:** ✅ WORKS

---

### 🔴 CASE 11: Valid JSON But Wrong Schema (CRITICAL)

**Input:**

```json
{
  "recommendedPrice": "2500",
  "priceRange": "Not available",
  "reason": 12345
}
```

**cleanGeminiJson Output:** Valid JSON (unchanged)
**Result:**

```typescript
recommendation = JSON.parse(cleanedResponse); // ✅ Succeeds!
return res.status(200).json(recommendation); // ✅ Returns to frontend!
```

**Status:** 🔴 **NOT CAUGHT** - Invalid response sent to frontend

**Frontend Impact:**

- Frontend expects `recommendedPrice: number` but gets `string`
- Frontend expects `priceRange.min: number` but gets `string`
- Type mismatch will cause runtime errors in frontend calculations

---

### 🔴 CASE 12: Missing Required Fields (CRITICAL)

**Input:**

```json
{
  "recommendedPrice": 2500
}
```

**Result:**

```typescript
recommendation = JSON.parse(cleanedResponse); // ✅ Valid JSON!
return res.status(200).json(recommendation);
// Frontend gets incomplete object, missing priceRange and reason
```

**Status:** 🔴 **NOT CAUGHT** - Incomplete response sent to frontend

---

### 🔴 CASE 13: Extra/Unexpected Fields (LOW RISK)

**Input:**

```json
{
  "recommendedPrice": 2500,
  "priceRange": { "min": 2400, "max": 2600 },
  "reason": "Market stable",
  "confidence": 0.95,
  "disclaimer": "This is not financial advice"
}
```

**Result:**

```typescript
recommendation = JSON.parse(cleanedResponse); // ✅ Succeeds
return res.status(200).json(recommendation); // Returns all fields
```

**Status:** ⚠️ **WORKS** but frontend should ignore extra fields

---

### 🚨 CASE 14: Nested Braces in String Values

**Input:**

```json
{
  "reason": "Look at this: { \"nested\": true }",
  "priceRange": { "min": 100, "max": 200 }
}
```

**cleanGeminiJson Logic:**

```typescript
const firstBrace = cleaned.indexOf("{"); // 0 - finds opening of JSON object
const lastBrace = cleaned.lastIndexOf("}"); // Position of LAST }
// This correctly finds the closing of the JSON object
cleaned = substring(0, lastBrace + 1);
```

**Output:** Full valid JSON
**Result:** ✅ Parses correctly
**Status:** ✅ WORKS

---

## Severity Summary

| Case   | Issue                      | Caught?                   | Severity |
| ------ | -------------------------- | ------------------------- | -------- |
| 1      | Empty response             | ✅ Try-catch              | LOW      |
| 2      | No braces                  | ✅ Try-catch              | LOW      |
| 3      | Incomplete JSON (no close) | ✅ Try-catch              | LOW      |
| 4      | Only close brace           | ✅ Try-catch              | LOW      |
| 5      | Multiple objects           | ✅ Try-catch              | LOW      |
| 6      | Array instead of object    | ⚠️ Works but fragile      | MEDIUM   |
| 7      | Text before/after JSON     | ✅ Works as intended      | NONE     |
| 8      | Trailing comma             | ✅ Try-catch              | LOW      |
| 9      | JavaScript literals        | ✅ Try-catch              | LOW      |
| 10     | Escaped characters         | ✅ Works                  | NONE     |
| **11** | **Wrong data types**       | ❌ **NOT CAUGHT**         | **HIGH** |
| **12** | **Missing fields**         | ❌ **NOT CAUGHT**         | **HIGH** |
| 13     | Extra fields               | ⚠️ Works, potential noise | VERY LOW |
| 14     | Nested braces in strings   | ✅ Works                  | NONE     |

---

## Critical Vulnerabilities Found

### Vulnerability #1: No Schema Validation After Parsing

```typescript
// CURRENT (VULNERABLE)
const recommendation = JSON.parse(cleanedResponse);
return res.status(200).json(recommendation); // ⚠️ No type checking!

// SHOULD BE
const validation = priceRecommendationSchema.safeParse(
  JSON.parse(cleanedResponse),
);
if (!validation.success) {
  return res.status(500).json({ error: "Invalid response schema from AI" });
}
return res.status(200).json(validation.data);
```

### Vulnerability #2: No Validation of Content Semantics

Gemini could return:

```json
{
  "recommendedPrice": -999999,
  "priceRange": { "min": 10000, "max": 5000 },
  "reason": ""
}
```

This is syntactically valid JSON but semantically invalid (negative price, inverted range, empty reason).

### Vulnerability #3: Integer vs Float Confusion

Gemini might return prices with decimals:

```json
{
  "recommendedPrice": 2500.567,
  "priceRange": { "min": 2400.123, "max": 2600.789 }
}
```

If frontend expects integers, this causes calculation errors.

---

## Recommended Fixes

### Fix 1: Add Post-Parse Validation

```typescript
const priceResponseSchema = z.object({
  recommendedPrice: z.number().positive(),
  priceRange: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
  }),
  reason: z.string().min(1),
});

app.post("/api/ai/price", async (req: Request, res: Response) => {
  try {
    // ... existing code ...
    const cleanedResponse = cleanGeminiJson(response);

    // Parse JSON
    let parsedJson;
    try {
      parsedJson = JSON.parse(cleanedResponse);
    } catch (e) {
      return res.status(500).json({ error: "Invalid JSON from AI" });
    }

    // Validate schema
    const validation = priceResponseSchema.safeParse(parsedJson);
    if (!validation.success) {
      console.error("Invalid AI response schema:", validation.error);
      return res.status(500).json({
        error: "AI response does not match expected format",
        details: validation.error.format(),
      });
    }

    return res.status(200).json(validation.data);
  } catch (error) {
    // ... existing error handling ...
  }
});
```

### Fix 2: Add Semantic Validation

```typescript
const priceResponseSchema = z
  .object({
    recommendedPrice: z.number().positive("Price must be positive"),
    priceRange: z.object({
      min: z.number().positive(),
      max: z.number().positive(),
    }),
    reason: z.string().min(5, "Reason must be at least 5 characters"),
  })
  .refine((data) => data.priceRange.min < data.priceRange.max, {
    message: "Min price must be less than max price",
  })
  .refine(
    (data) =>
      data.priceRange.min <= data.recommendedPrice &&
      data.recommendedPrice <= data.priceRange.max,
    { message: "Recommended price must be within the range" },
  );
```

### Fix 3: Improve cleanGeminiJson with Fallback

````typescript
function cleanGeminiJson(response: string): string {
  if (!response || typeof response !== "string") {
    return "";
  }

  let cleaned = response.trim();

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/gi, "");
  cleaned = cleaned.replace(/```\s*/g, "");
  cleaned = cleaned.trim();

  // Extract JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    // No valid JSON found
    return "";
  }

  // Extract and validate bracket matching
  cleaned = cleaned.substring(firstBrace, lastBrace + 1);

  return cleaned;
}
````

### Fix 4: Add Response Timeout/Retry

```typescript
const MAX_RETRIES = 2;
const TIMEOUT_MS = 30000;

async function askGeminiWithValidation(prompt, schema) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await askGemini(prompt);
      const cleaned = cleanGeminiJson(response);
      const parsed = JSON.parse(cleaned);
      const validated = schema.safeParse(parsed);

      if (validated.success) {
        return validated.data;
      }

      console.warn(`Attempt ${i + 1}: Invalid schema, retrying...`);
    } catch (e) {
      if (i === MAX_RETRIES - 1) throw e;
      console.warn(`Attempt ${i + 1}: Failed, retrying...`);
    }
  }
}
```

---

## Testing Recommendations

Create test cases for edge cases:

````typescript
describe("cleanGeminiJson", () => {
  it("should handle empty string", () => {
    expect(cleanGeminiJson("")).toBe("");
  });

  it("should handle no braces", () => {
    expect(cleanGeminiJson("Hello world")).toBe("");
  });

  it("should extract JSON with surrounding text", () => {
    const input = 'Here is the result: {"key": "value"} Hope this helps!';
    expect(cleanGeminiJson(input)).toBe('{"key": "value"}');
  });

  it("should handle markdown code blocks", () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(cleanGeminiJson(input)).toBe('{"key": "value"}');
  });

  it("should return empty string for unmatched braces", () => {
    expect(cleanGeminiJson("{")).toBe("");
    expect(cleanGeminiJson("}")).toBe("");
  });
});
````

---

## Summary

**The current implementation is vulnerable to:**

1. ✅ JSON syntax errors (properly caught)
2. ❌ **Schema mismatches** (NOT caught) - **HIGH RISK**
3. ❌ **Semantic validation failures** (NOT caught) - **HIGH RISK**
4. ⚠️ Unexpected extra fields (works but should be filtered)

**Immediate Action Required:**
Add post-parse schema validation using the existing Zod schemas to catch invalid responses from Gemini before sending to the frontend.
