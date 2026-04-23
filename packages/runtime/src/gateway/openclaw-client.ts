import { listFilesClient, readFileClient } from "./file-client";
import { researchNoteClient } from "./search-client";
import { sessionNoteClient } from "./session-client";

export function createOpenClawGatewayClient() {
  return {
    readFile: readFileClient,
    listFiles: listFilesClient,
    researchNote: researchNoteClient,
    sessionNote: sessionNoteClient
  };
}
