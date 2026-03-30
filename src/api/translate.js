import { request } from "./client.js";

async function translateBatch({ target, texts }) {
  return request("/translate/batch", {
    method: "POST",
    body: {
      target,
      texts,
    },
  });
}

export { translateBatch };
