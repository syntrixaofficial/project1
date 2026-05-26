import http from "node:http";

const host = process.env.MOCK_INFERENCE_HOST || "0.0.0.0";
const port = Number(process.env.MOCK_INFERENCE_PORT || 8000);
const model = process.env.NEMOCLAW_MODEL || "syntrixa-security-stub";

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(data),
  });
  res.end(data);
}

function collect(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function completionPayload(request) {
  const tool = Array.isArray(request.tools) ? request.tools[0] : null;
  const message = tool
    ? {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call_syntrixa_stub",
            type: "function",
            function: {
              name: tool.function?.name || "noop",
              arguments: "{}",
            },
          },
        ],
      }
    : {
        role: "assistant",
        content:
          "Syntrixa security stub is active. Configure a real model provider before production reasoning.",
      };

  return {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message,
        finish_reason: tool ? "tool_calls" : "stop",
      },
    ],
    usage: {
      prompt_tokens: 1,
      completion_tokens: 1,
      total_tokens: 2,
    },
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, { status: "ok", model });
  }

  if (req.method === "GET" && req.url === "/v1/models") {
    return json(res, 200, {
      object: "list",
      data: [{ id: model, object: "model", created: 0, owned_by: "syntrixa" }],
    });
  }

  if (req.method === "POST" && req.url === "/v1/chat/completions") {
    const request = await collect(req);
    return json(res, 200, completionPayload(request));
  }

  return json(res, 404, { error: { message: "not found" } });
});

server.listen(port, host, () => {
  console.log(`mock inference server listening on ${host}:${port} (${model})`);
});
