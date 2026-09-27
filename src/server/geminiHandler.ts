import { GoogleGenAI, Type } from "@google/genai";

export interface OutlineResult {
  polygon: Array<{ x: number; y: number }>;
  confidence: number;
  reason: string;
  roughEstimate?: {
    estimatedLengthFt?: number;
    estimatedWidthFt?: number;
    referenceClues?: string;
  };
}

export async function detectSlabOutline(base64Image: string, mimeType: string = "image/jpeg"): Promise<OutlineResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Clean base64 string if it contains data URI prefix
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

  if (!apiKey) {
    console.warn("GEMINI_API_KEY not configured. Falling back to default detection polygon.");
    return {
      polygon: [
        { x: 0.18, y: 0.25 },
        { x: 0.82, y: 0.22 },
        { x: 0.86, y: 0.78 },
        { x: 0.14, y: 0.82 },
      ],
      confidence: 0.45,
      reason: "API key not set. Provided default 4-corner slab polygon for manual adjustment.",
      roughEstimate: {
        estimatedLengthFt: 20,
        estimatedWidthFt: 14,
        referenceClues: "Standard residential slab estimate (please calibrate with known dimension)",
      },
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const prompt = `You are an expert civil construction survey engineer and concrete estimator.
Analyze this photo taken on a construction site of a planned concrete slab pour area (look for wooden 2x4/2x6 formwork, perimeter stakes, gravel/crushed stone base, vapor barrier, rebar/wire mesh, or excavated slab area).

Identify the exact perimeter boundary of the slab formwork/pour area as a closed polygon of vertices.
Each vertex MUST have normalized coordinates x and y between 0.0 and 1.0, where (0,0) is the top-left corner and (1,1) is the bottom-right corner of the image.
Provide 4 to 8 vertices that trace the outer formwork edges in clockwise order.

Also evaluate visible real-world references (e.g., standard 2x4/2x6 lumber, 12-inch or 16-inch rebar grid, cinder blocks, doorways, shoes, wheelbarrow) to provide a rough estimate of the slab length and width in feet.

Return ONLY valid JSON matching this schema:
{
  "polygon": [
    {"x": number, "y": number}
  ],
  "confidence": number between 0.0 and 1.0,
  "reason": "short explanation of what formwork/features were detected",
  "roughEstimate": {
    "estimatedLengthFt": number,
    "estimatedWidthFt": number,
    "referenceClues": "short note on reference objects used"
  }
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            polygon: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                },
                required: ["x", "y"],
              },
            },
            confidence: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            roughEstimate: {
              type: Type.OBJECT,
              properties: {
                estimatedLengthFt: { type: Type.NUMBER },
                estimatedWidthFt: { type: Type.NUMBER },
                referenceClues: { type: Type.STRING },
              },
            },
          },
          required: ["polygon", "confidence", "reason"],
        },
      },
    });

    const text = response.text?.trim() || "";
    const parsed = JSON.parse(text);

    // Validate polygon vertices
    const validPolygon = Array.isArray(parsed.polygon) && parsed.polygon.length >= 3
      ? parsed.polygon.map((p: { x: number; y: number }) => ({
          x: Math.min(1, Math.max(0, Number(p.x) || 0)),
          y: Math.min(1, Math.max(0, Number(p.y) || 0)),
        }))
      : [
          { x: 0.15, y: 0.2 },
          { x: 0.85, y: 0.2 },
          { x: 0.85, y: 0.8 },
          { x: 0.15, y: 0.8 },
        ];

    return {
      polygon: validPolygon,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.6)),
      reason: String(parsed.reason || "Detected perimeter formwork."),
      roughEstimate: parsed.roughEstimate,
    };
  } catch (error) {
    console.error("Gemini outline detection failed:", error);
    return {
      polygon: [
        { x: 0.15, y: 0.2 },
        { x: 0.85, y: 0.2 },
        { x: 0.85, y: 0.8 },
        { x: 0.15, y: 0.8 },
      ],
      confidence: 0.35,
      reason: "Auto-detect encountered an issue. Tap to place or adjust points manually.",
      roughEstimate: {
        estimatedLengthFt: 18,
        estimatedWidthFt: 12,
        referenceClues: "Rough default estimate",
      },
    };
  }
}
