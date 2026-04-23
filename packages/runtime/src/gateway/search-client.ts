export function researchNoteClient(query: string, sources: string[] = []): { query: string; sources: string[]; note: string } {
  return {
    query,
    sources,
    note: `Research note for \"${query}\" based on ${sources.length ? sources.join(", ") : "no explicit sources"}.`
  };
}
