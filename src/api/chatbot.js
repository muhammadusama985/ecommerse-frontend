import { request } from "./client";

async function sendChatbotMessage(message) {
  const response = await request("/chatbot", {
    method: "POST",
    body: { message },
    allowRefresh: false,
  });

  return response.data;
}

export { sendChatbotMessage };
