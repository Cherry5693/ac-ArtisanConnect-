// CommonJS for your backend
const { InferenceClient } = require('@huggingface/inference');

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
const HF_MODEL = process.env.HF_EMBED_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';

// Reusable client (hosted by Hugging Face)
const client = new InferenceClient(HF_TOKEN);

// Embed a list of strings with the chosen model
async function embedTexts(texts) {
  // Some HF models expose embeddings via feature-extraction endpoints in the JS SDK
  // Returns an array of vectors (float arrays), one per input text
  const vectors = [];
  for (const t of texts) {
    const v = await client.featureExtraction({
      model: HF_MODEL,
      inputs: t,
    });
    vectors.push(v);
  }
  return vectors;
}

module.exports = { embedTexts };