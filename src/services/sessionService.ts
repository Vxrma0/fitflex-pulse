/**
 * Stub session upload — logs to console and saves to localStorage.
 * Ready to swap for Firebase/Supabase later.
 */
export async function uploadSession(summary: Record<string, unknown>) {
  const id = `session_${Date.now()}`;
  console.log("[sessionService] uploadSession", id, summary);

  try {
    const existing = JSON.parse(localStorage.getItem("fitflex_sessions") || "[]");
    existing.push({ id, ...summary });
    localStorage.setItem("fitflex_sessions", JSON.stringify(existing));
  } catch {
    // storage full or unavailable
  }

  return { ok: true, id };
}

export function getSessions(): Record<string, unknown>[] {
  try {
    return JSON.parse(localStorage.getItem("fitflex_sessions") || "[]");
  } catch {
    return [];
  }
}
