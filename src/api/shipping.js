import { request } from "./client";

async function getAramexRate(token, payload) {
  const response = await request("/shipping/aramex/rate", {
    method: "POST",
    token,
    body: payload,
  });
  return response.data;
}

export { getAramexRate };
