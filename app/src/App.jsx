import React, { useState, useCallback, useEffect } from 'react';
import {
  getBaseUrl,
  setBaseUrl,
  runGeneration,
  getImageUrl,
  fetchCheckpoints,
  testConnection,
} from './api';
import './App.css';

const SIZES = [
  [512, 512],
  [768, 768],
  [1024, 1024],
];

function App() {
  const [baseUrl, setBaseUrlState] = useState(getBaseUrl());
  const [positivePrompt, setPositivePrompt] = useState('sunset over mountains, digital art, high quality');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted');
  const [seedInput, setSeedInput] = useState('');
  const [steps, setSteps] = useState(20);
  const [cfg, setCfg] = useState(7.5);
  const [sizeIndex, setSizeIndex] = useState(1);
  const [batchSize, setBatchSize] = useState(2);
  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [connectionTest, setConnectionTest] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    if (!baseUrl) {
      setCheckpoints([]);
      setSelectedCheckpoint('');
      return;
    }
    fetchCheckpoints(baseUrl).then((list) => {
      setCheckpoints(list);
      setSelectedCheckpoint((prev) => (list.includes(prev) ? prev : list[0] || ''));
    });
  }, [baseUrl]);

  const handleBaseUrlChange = (e) => {
    const v = e.target.value.trim();
    setBaseUrlState(v);
    setBaseUrl(v || undefined);
    setConnectionTest(null);
  };

  const handleTestConnection = useCallback(async () => {
    const url = baseUrl || getBaseUrl();
    setConnectionTest(null);
    setTestingConnection(true);
    try {
      const result = await testConnection(url);
      setConnectionTest(result);
    } finally {
      setTestingConnection(false);
    }
  }, [baseUrl]);

  const run = useCallback(async () => {
    setError(null);
    setStatus('Generating…');
    setGenerating(true);
    setResults([]);
    try {
      const [width, height] = SIZES[sizeIndex];
      const params = {
        positivePrompt,
        negativePrompt,
        seed: seedInput === '' || seedInput.toLowerCase() === 'random' ? undefined : seedInput,
        steps,
        cfg,
        width,
        height,
        batchSize,
        ckptName: selectedCheckpoint || undefined,
      };
      const { images } = await runGeneration(params, baseUrl || undefined);
      setStatus('Done');
      setResults(
        images.map((img) => ({
          url: getImageUrl(img.filename, img.subfolder, img.type, baseUrl || undefined),
          filename: img.filename,
        }))
      );
    } catch (err) {
      const msg = err.message || 'Generation failed';
      const isNetworkError = msg === 'Failed to fetch' || msg.includes('NetworkError');
      setError(
        isNetworkError
          ? `Cannot reach ComfyUI at ${baseUrl || 'the configured URL'}. Check that ComfyUI is running, the URL/port is correct (e.g. http://127.0.0.1:8000), and CORS is enabled (*).`
          : msg
      );
      setStatus('');
    } finally {
      setGenerating(false);
    }
  }, [
    baseUrl,
    positivePrompt,
    negativePrompt,
    seedInput,
    steps,
    cfg,
    sizeIndex,
    batchSize,
    selectedCheckpoint,
  ]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Image Generator</h1>
      </header>

      <div className="layout">
        <aside className="panel params-panel">
          <h2>Parameters</h2>

          <div className="field group-url">
            <label>ComfyUI URL</label>
            <div className="url-row">
              <input
                type="url"
                value={baseUrl}
                onChange={handleBaseUrlChange}
                placeholder="http://127.0.0.1:8000"
                disabled={generating}
              />
              <button
                type="button"
                className="btn-test"
                onClick={handleTestConnection}
                disabled={generating || testingConnection}
              >
                {testingConnection ? 'Testing…' : 'Test connection'}
              </button>
            </div>
            {connectionTest && (
              <p className={`connection-result ${connectionTest.ok ? 'ok' : 'fail'}`}>
                {connectionTest.ok
                  ? `✓ ComfyUI reachable. ${connectionTest.checkpoints} checkpoint(s) found.`
                  : `✗ ${connectionTest.error}`}
              </p>
            )}
          </div>

          {checkpoints.length > 0 && (
            <div className="field">
              <label>Checkpoint</label>
              <select
                value={selectedCheckpoint}
                onChange={(e) => setSelectedCheckpoint(e.target.value)}
                disabled={generating}
              >
                {checkpoints.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label>Positive prompt</label>
            <textarea
              value={positivePrompt}
              onChange={(e) => setPositivePrompt(e.target.value)}
              placeholder="What to include..."
              rows={3}
              disabled={generating}
            />
          </div>

          <div className="field">
            <label>Negative prompt</label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="What to exclude..."
              rows={2}
              disabled={generating}
            />
          </div>

          <div className="row two-cols">
            <div className="field">
              <label>Seed (empty = random)</label>
              <input
                type="text"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                placeholder="random"
                disabled={generating}
              />
            </div>
            <div className="field">
              <label>Steps</label>
              <input
                type="number"
                min={10}
                max={50}
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                disabled={generating}
              />
            </div>
          </div>

          <div className="row two-cols">
            <div className="field">
              <label>CFG Scale</label>
              <input
                type="number"
                min={1}
                max={20}
                step={0.5}
                value={cfg}
                onChange={(e) => setCfg(Number(e.target.value))}
                disabled={generating}
              />
            </div>
            <div className="field">
              <label>Size</label>
              <select
                value={sizeIndex}
                onChange={(e) => setSizeIndex(Number(e.target.value))}
                disabled={generating}
              >
                {SIZES.map(([w, h], i) => (
                  <option key={i} value={i}>{w} × {h}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Batch (Nr images)</label>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              disabled={generating}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-generate"
            onClick={run}
            disabled={generating}
          >
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </aside>

        <main className="panel results-panel">
          <h2>Results</h2>
          {status && <p className="status">{status}</p>}
          {error && <p className="error">{error}</p>}
          {results.length > 0 ? (
            <div className="results-grid">
              {results.map((item, i) => (
                <div key={i} className="result-item">
                  <img src={item.url} alt={item.filename} />
                  <span className="filename">{item.filename}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="placeholder">
              Results will appear here after you click Generate.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
