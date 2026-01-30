/**
 * ComfyUI API helpers for Task 3.
 * Base URL: ComfyUI server (e.g. http://127.0.0.1:8000).
 */

const defaultBaseUrl = 'http://127.0.0.1:8000';

function normalizeBaseUrl(url) {
  const u = url || (typeof window !== 'undefined' && window.__COMFY_BASE_URL__) || defaultBaseUrl;
  return String(u).replace(/\/+$/, '') || defaultBaseUrl;
}

export function getBaseUrl() {
  return normalizeBaseUrl(typeof window !== 'undefined' && window.__COMFY_BASE_URL__);
}

export function setBaseUrl(url) {
  if (typeof window !== 'undefined') window.__COMFY_BASE_URL__ = normalizeBaseUrl(url || defaultBaseUrl);
}

/**
 * Test if ComfyUI is reachable from the browser (connection + CORS).
 * Returns { ok: true, checkpoints: number } or { ok: false, error: string, triedUrl: string }.
 */
export async function testConnection(baseUrl = getBaseUrl()) {
  const base = normalizeBaseUrl(baseUrl);
  const triedUrl = `${base}/object_info`;
  try {
    const res = await fetch(triedUrl);
    if (!res.ok) return { ok: false, error: `Server returned ${res.status}`, triedUrl };
    const info = await res.json();
    const node = info?.CheckpointLoaderSimple;
    const list = node?.input?.required?.ckpt_name;
    const count = Array.isArray(list) ? list.length : 0;
    return { ok: true, checkpoints: count };
  } catch (e) {
    const msg = e?.message || 'Unknown error';
    if (msg === 'Failed to fetch') {
      return {
        ok: false,
        triedUrl: base,
        error: 'Connection failed.',
      };
    }
    return { ok: false, error: msg, triedUrl: base };
  }
}

/**
 * Fetch list of available checkpoint names from ComfyUI (for validation).
 * Returns array of strings; empty if ComfyUI uses a different structure or is unreachable.
 */
export async function fetchCheckpoints(baseUrl = getBaseUrl()) {
  const base = normalizeBaseUrl(baseUrl);
  try {
    const res = await fetch(`${base}/object_info`);
    if (!res.ok) return [];
    const info = await res.json();
    const node = info?.CheckpointLoaderSimple;
    if (!node) return [];
    const required = node.input?.required;
    const ckpt = required?.ckpt_name;
    if (!ckpt || !Array.isArray(ckpt)) return [];
    return ckpt.map((item) => (Array.isArray(item) ? item[0] : item));
  } catch {
    return [];
  }
}

/**
 * Build workflow prompt from user parameters (matches workflow_api_prompt.example.json).
 * Node IDs: 4=Checkpoint, 5=EmptyLatent, 6=Positive CLIP, 7=Negative CLIP, 3=KSampler, 8=VAEDecode, 9=SaveImage.
 */
export function buildPrompt(params) {
  const {
    positivePrompt = '',
    negativePrompt = 'blurry, low quality',
    seed,
    steps = 20,
    cfg = 7.5,
    width = 768,
    height = 768,
    batchSize = 2,
    ckptName = 'v1-5-pruned-emaonly.safetensors',
    filenamePrefix = 'content_gen',
  } = params;

  const actualSeed = seed === undefined || seed === '' || String(seed).toLowerCase() === 'random'
    ? Math.floor(Math.random() * 2 ** 32)
    : Number(seed);

  return {
    4: {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: ckptName },
    },
    5: {
      class_type: 'EmptyLatentImage',
      inputs: { width, height, batch_size: Math.max(1, Math.min(4, batchSize)) },
    },
    6: {
      class_type: 'CLIPTextEncode',
      inputs: { text: positivePrompt || 'a beautiful image', clip: ['4', 1] },
    },
    7: {
      class_type: 'CLIPTextEncode',
      inputs: { text: negativePrompt || 'blurry, low quality', clip: ['4', 1] },
    },
    3: {
      class_type: 'KSampler',
      inputs: {
        seed: actualSeed,
        steps,
        cfg,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0],
      },
    },
    8: {
      class_type: 'VAEDecode',
      inputs: { samples: ['3', 0], vae: ['4', 2] },
    },
    9: {
      class_type: 'SaveImage',
      inputs: { images: ['8', 0], filename_prefix: `${filenamePrefix}_${Date.now()}_${actualSeed}` },
    },
  };
}

/**
 * Queue prompt and return prompt_id.
 */
export async function queuePrompt(prompt, baseUrl = getBaseUrl()) {
  const base = normalizeBaseUrl(baseUrl);
  const res = await fetch(`${base}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Queue failed: ${res.status}`);
  }
  const data = await res.json();
  return data.prompt_id;
}

/**
 * Get history for a prompt_id. Returns output node data (e.g. images) when finished.
 */
export async function getHistory(promptId, baseUrl = getBaseUrl()) {
  const base = normalizeBaseUrl(baseUrl);
  const res = await fetch(`${base}/history/${promptId}`);
  if (!res.ok) throw new Error(`History failed: ${res.status}`);
  const data = await res.json();
  return data[promptId];
}

/**
 * Poll until prompt is in history with outputs (or error).
 */
export async function waitForCompletion(promptId, baseUrl = getBaseUrl(), options = {}) {
  const base = normalizeBaseUrl(baseUrl);
  const { pollInterval = 800, maxWait = 300000 } = options;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const history = await getHistory(promptId, base);
    if (history) {
      if (history.outputs) return { ok: true, history };
      if (history.status?.status_str === 'error') return { ok: false, error: history.status?.messages?.[0] || 'Unknown error' };
    }
    await new Promise((r) => setTimeout(r, pollInterval));
  }
  return { ok: false, error: 'Timeout waiting for generation' };
}

/**
 * Get image URL for a ComfyUI output image.
 */
export function getImageUrl(filename, subfolder = '', type = 'output', baseUrl = getBaseUrl()) {
  const base = normalizeBaseUrl(baseUrl);
  const params = new URLSearchParams({ filename, type });
  if (subfolder) params.set('subfolder', subfolder);
  return `${base}/view?${params.toString()}`;
}

/**
 * Full flow: queue prompt, wait for completion, return image infos (filename, subfolder, type).
 * If ckptName is not in ComfyUI's list, fetches the list and uses the first available checkpoint.
 */
export async function runGeneration(params, baseUrl = getBaseUrl()) {
  const base = normalizeBaseUrl(baseUrl);
  let ckptName = params.ckptName;
  const checkpoints = await fetchCheckpoints(base);
  if (checkpoints.length > 0) {
    if (!ckptName || !checkpoints.includes(ckptName)) {
      ckptName = checkpoints[0];
    }
  }
  const paramsWithCkpt = { ...params, ckptName: ckptName || params.ckptName };
  const prompt = buildPrompt(paramsWithCkpt);
  const promptId = await queuePrompt(prompt, base);
  const result = await waitForCompletion(promptId, base);
  if (!result.ok) throw new Error(result.error || 'Generation failed');

  const images = [];
  const outputs = result.history?.outputs || {};
  for (const nodeId of Object.keys(outputs)) {
    const node = outputs[nodeId];
    if (node.images) {
      for (const img of node.images) {
        images.push({
          filename: img.filename,
          subfolder: img.subfolder || '',
          type: img.type || 'output',
        });
      }
    }
  }
  return { promptId, images };
}
