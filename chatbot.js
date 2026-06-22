import { Groq } from "groq-sdk";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cache = new NodeCache({ stdTTL: 60 * 60 * 24, checkperiod: 600 }); // 24 hrs

const TEXT_MODEL = "llama-3.1-8b-instant";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const webSearchTool = {
  type: "function",
  function: {
    name: "webSearch",
    description: "Search the latest information and realtime data on the web.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to perform search on the web.",
        },
      },
      required: ["query"],
    },
  },
};

export async function generate(userMessage, threadId, attachment = null) {
  const baseMessages = [
    {
      role: "system",
      content: `You are a smart personal assistant.

Answer questions clearly and concisely in plain English.

You have access to a tool called webSearch that can retrieve real-time and up-to-date information from the web.

Rules:
- Use your own knowledge for general questions.
- Use the webSearch tool whenever the user asks for current weather, news, stock prices, sports scores, live events, or any recently changed information.
- If you are unsure whether your knowledge is current, use the tool.
- Never make up facts.
- When a tool is available and needed, call the tool directly using the tool-calling mechanism.
- After receiving the tool result, answer the user's question naturally.
- When analyzing images or PDF documents, be thorough and descriptive.

Current UTC date and time: ${new Date().toUTCString()}
`,
    },
  ];

  const messages = cache.get(threadId) ?? baseMessages;
  const isVision = attachment?.type === "image";

  // Build user content based on attachment type
  let userContent;
  if (attachment?.type === "image") {
    userContent = [
      {
        type: "image_url",
        image_url: { url: `data:${attachment.mimeType};base64,${attachment.data}` },
      },
      { type: "text", text: userMessage },
    ];
  } else if (attachment?.type === "pdf") {
    // Truncate PDF text to stay within token limits
    const truncated = (attachment.text || "").substring(0, 12000);
    userContent = `The user uploaded a PDF named "${attachment.filename}". Extracted content:\n\n---\n${truncated}\n---\n\nUser question: ${userMessage}`;
  } else {
    userContent = userMessage;
  }

  messages.push({ role: "user", content: userContent });

  const model = isVision ? VISION_MODEL : TEXT_MODEL;
  const MAX_RETRIES = 10;
  let count = 0;

  while (true) {
    if (count > MAX_RETRIES) return "I could not find the result. Please try again.";
    count++;

    const response = await groq.chat.completions.create({
      temperature: 0,
      model,
      messages,
      // Vision model handles image understanding; no tool calls needed for image queries
      ...(isVision ? {} : { tools: [webSearchTool], tool_choice: "auto" }),
    });

    messages.push(response.choices[0].message);

    const tool_calls = response.choices[0].message.tool_calls;
    if (!tool_calls || tool_calls.length === 0) {
      // Replace image content with a text summary before caching so subsequent
      // text-only calls in the same thread don't receive raw base64 data
      if (isVision) {
        const imgIdx = messages.findIndex(
          m => Array.isArray(m.content) && m.content.some(c => c.type === "image_url")
        );
        if (imgIdx !== -1) {
          messages[imgIdx] = {
            role: "user",
            content: `[User sent an image and asked]: ${userMessage}`,
          };
        }
      }
      cache.set(threadId, messages);
      return response.choices[0].message.content ?? "I'm sorry, I couldn't generate a response. Please try again.";
    }

    for (const tool of tool_calls) {
      const functionName = tool.function.name;
      const functionParams = tool.function.arguments;

      if (functionName === "webSearch") {
        const tool_response = await webSearch(JSON.parse(functionParams));
        messages.push({
          tool_call_id: tool.id,
          role: "tool",
          name: functionName,
          content: tool_response,
        });
      } else {
        messages.push({
          tool_call_id: tool.id,
          role: "tool",
          name: functionName,
          content: `Unknown tool: ${functionName}`,
        });
      }
    }
  }
}

async function webSearch({ query }) {
  console.log("Performing web search for query ...");
  try {
    const response = await tvly.search(query);
    return response.results.map(result => result.content).join("\n\n");
  } catch (err) {
    console.error("Web search failed:", err.message);
    return "Web search failed. Please try answering from your own knowledge.";
  }
}
