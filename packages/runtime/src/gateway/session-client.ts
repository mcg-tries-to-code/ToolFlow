export function sessionNoteClient(prompt: string): { mode: "local_session_note"; prompt: string; response: string } {
  return {
    mode: "local_session_note",
    prompt,
    response: `Local ToolFlow session note: ${prompt}`
  };
}
