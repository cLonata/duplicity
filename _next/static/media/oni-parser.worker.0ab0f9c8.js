import {
  parseSaveGame,
  progressReporter,
  writeSaveGame,
} from "@clonata/oni-save-parser";

self.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || typeof message !== "object") {
    return;
  }

  const { id, type, payload } = message;
  if (!id || !type) {
    return;
  }

  try {
    if (type === "parse") {
      handleParse(id, payload);
      return;
    }
    if (type === "write") {
      handleWrite(id, payload);
      return;
    }
  } catch (error) {
    postMessage({ id, type: "error", error: serializeError(error) });
  }
});

function handleParse(id, payload) {
  const options = payload?.options || {};
  const interceptor = options.reportProgress
    ? progressReporter((message) => {
        postMessage({ id, type: "progress", message });
      })
    : undefined;

  const save = parseSaveGame(payload.buffer, {
    versionStrictness: options.versionStrictness || "major",
    interceptor,
  });

  postMessage({ id, type: "result", payload: save });
}

function handleWrite(id, payload) {
  const options = payload?.options || {};
  const interceptor = options.reportProgress
    ? progressReporter((message) => {
        postMessage({ id, type: "progress", message });
      })
    : undefined;

  const buffer = writeSaveGame(payload.saveGame, interceptor);
  postMessage({ id, type: "result", payload: buffer }, [buffer]);
}

function serializeError(error) {
  if (!error || typeof error !== "object") {
    return { message: "Unknown error" };
  }
  return {
    message: error.message || "Unknown error",
    code: error.code,
    stack: error.stack,
  };
}
