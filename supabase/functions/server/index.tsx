import { Hono } from "npm:hono@4";
import { cors } from "npm:hono@4/cors";
import { del, get, mset, set } from "./kv_store.tsx";

const app = new Hono();

// Enable CORS
app.use("/*", cors({ origin: "*" }));

// Health check
app.get("/make-server-61e9fc0f/health", (c) => c.json({ status: "ok" }));

// All endpoints return mock data for demo
app.post("/make-server-61e9fc0f/signup", (c) => 
  c.json({ success: true, user: { id: "demo", email: "demo@example.com", name: "Demo" } })
);

app.post("/make-server-61e9fc0f/generate-story", (c) => 
  c.json({ 
    storyId: "demo", 
    story: "Demo story content", 
    lexileLevel: "400-600" 
  })
);

app.post("/make-server-61e9fc0f/analyze-words", (c) => 
  c.json({ importantWords: ["demo", "story", "words"] })
);

app.post("/make-server-61e9fc0f/generate-questions", (c) => 
  c.json({ questions: [] })
);

app.post("/make-server-61e9fc0f/breakdown-question", (c) => 
  c.json({ breakdown: null })
);

app.post("/make-server-61e9fc0f/save-metrics", (c) => 
  c.json({ success: true })
);

app.get("/make-server-61e9fc0f/metrics/:userId", (c) => 
  c.json({ totalWordsRead: 0, totalPagesRead: 0, totalQuestionsAnswered: 0, totalQuestionsCorrect: 0, byLexileLevel: {} })
);

app.post("/make-server-61e9fc0f/save-profile", (c) => 
  c.json({ success: true })
);

app.get("/make-server-61e9fc0f/profile/:userId", (c) => 
  c.json({ profile: null })
);

app.post("/make-server-61e9fc0f/storage/set", async (c) => {
  try {
    const body = await c.req.json();
    const key = typeof body?.key === "string" ? body.key : "";

    if (!key) {
      return c.json({ success: false, error: "Missing key" }, 400);
    }

    await set(key, body?.value ?? null);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : "Failed to set key" }, 500);
  }
});

app.post("/make-server-61e9fc0f/storage/get", async (c) => {
  try {
    const body = await c.req.json();
    const key = typeof body?.key === "string" ? body.key : "";

    if (!key) {
      return c.json({ success: false, error: "Missing key" }, 400);
    }

    const value = await get(key);
    return c.json({ success: true, value: value ?? null });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : "Failed to get key" }, 500);
  }
});

app.post("/make-server-61e9fc0f/storage/mset", async (c) => {
  try {
    const body = await c.req.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    const validItems = items.filter(
      (item: unknown): item is { key: string; value: unknown } =>
        Boolean(item) && typeof (item as { key?: unknown }).key === "string",
    );

    if (validItems.length === 0) {
      return c.json({ success: false, error: "No valid items provided" }, 400);
    }

    await mset(
      validItems.map((item) => item.key),
      validItems.map((item) => item.value ?? null),
    );

    return c.json({ success: true, count: validItems.length });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : "Failed to set keys" }, 500);
  }
});

app.post("/make-server-61e9fc0f/storage/mget", async (c) => {
  try {
    const body = await c.req.json();
    const keys = Array.isArray(body?.keys) ? body.keys.filter((key: unknown) => typeof key === "string") : [];

    if (keys.length === 0) {
      return c.json({ success: false, error: "No keys provided" }, 400);
    }

    const valuesArray = await Promise.all(keys.map((key) => get(key)));
    const values: Record<string, unknown> = {};

    keys.forEach((key, index) => {
      values[key] = valuesArray[index] ?? null;
    });

    return c.json({ success: true, values });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : "Failed to get keys" }, 500);
  }
});

app.post("/make-server-61e9fc0f/storage/delete", async (c) => {
  try {
    const body = await c.req.json();
    const key = typeof body?.key === "string" ? body.key : "";

    if (!key) {
      return c.json({ success: false, error: "Missing key" }, 400);
    }

    await del(key);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : "Failed to delete key" }, 500);
  }
});

Deno.serve(app.fetch);