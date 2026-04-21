import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const MCP_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-61e9fc0f`;
const MCP_KEY_PREFIX = 'storyweaver';

function withPrefix(localKey: string): string {
  return localKey.startsWith(`${MCP_KEY_PREFIX}:`) ? localKey : `${MCP_KEY_PREFIX}:${localKey}`;
}

async function postJson<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${MCP_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`MCP storage request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function mcpStorageSetLocal(localKey: string, value: unknown): Promise<boolean> {
  try {
    await postJson('/storage/set', { key: withPrefix(localKey), value });
    return true;
  } catch (error) {
    console.warn('MCP set failed for key', localKey, error);
    return false;
  }
}

export async function mcpStorageGetLocal<T>(localKey: string): Promise<T | null> {
  try {
    const result = await postJson<{ value?: T | null }>('/storage/get', { key: withPrefix(localKey) });
    return result?.value ?? null;
  } catch (error) {
    console.warn('MCP get failed for key', localKey, error);
    return null;
  }
}

export async function mcpStorageMSetLocal(entries: Array<{ key: string; value: unknown }>): Promise<boolean> {
  try {
    const items = entries.map((entry) => ({ key: withPrefix(entry.key), value: entry.value }));
    await postJson('/storage/mset', { items });
    return true;
  } catch (error) {
    console.warn('MCP mset failed', error);
    return false;
  }
}

export async function mcpStorageMGetLocal<T>(keys: string[]): Promise<Record<string, T | null>> {
  const fallback: Record<string, T | null> = {};
  for (const key of keys) {
    fallback[key] = null;
  }

  try {
    const result = await postJson<{ values?: Record<string, T | null> }>('/storage/mget', {
      keys: keys.map(withPrefix),
    });

    const mapped: Record<string, T | null> = {};
    for (const key of keys) {
      const prefixed = withPrefix(key);
      mapped[key] = result?.values?.[prefixed] ?? null;
    }

    return mapped;
  } catch (error) {
    console.warn('MCP mget failed', error);
    return fallback;
  }
}
