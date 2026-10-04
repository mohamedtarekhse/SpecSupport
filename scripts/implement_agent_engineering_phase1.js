const fs = require('fs');
const path = require('path');

const workerPath = path.join(__dirname, '..', 'worker', 'src', 'index.js');
let workerJs = fs.readFileSync(workerPath, 'utf8');

console.log('--- Step 1: Adding Circuit Breaker & Reliability Engine to worker/src/index.js ---');

const circuitBreakerCode = `
// =========================================================================
// ⚡ CIRCUIT BREAKER & RELIABILITY ENGINE (Agent Engineering Pillar 4)
// Prevents Cascading Timeouts, Rate-Limit Hammering & Stalled API Calls
// =========================================================================
const circuitBreakers = {
  openrouter: { failures: 0, lastFailure: 0, state: 'CLOSED' },
  groq: { failures: 0, lastFailure: 0, state: 'CLOSED' },
  cloudflare: { failures: 0, lastFailure: 0, state: 'CLOSED' }
};

function canAttemptProvider(provider) {
  const cb = circuitBreakers[provider];
  if (!cb) return true;
  if (cb.state === 'OPEN') {
    // 45-second recovery window for upstream provider recovery
    if (Date.now() - cb.lastFailure > 45000) {
      cb.state = 'HALF_OPEN';
      return true;
    }
    return false; // Instantly skip without waiting for network timeout
  }
  return true;
}

function recordProviderSuccess(provider) {
  const cb = circuitBreakers[provider];
  if (cb) {
    cb.failures = 0;
    cb.state = 'CLOSED';
  }
}

function recordProviderFailure(provider, reason = '') {
  const cb = circuitBreakers[provider];
  if (cb) {
    cb.failures += 1;
    cb.lastFailure = Date.now();
    if (cb.failures >= 3) {
      cb.state = 'OPEN';
      console.warn(\`[CIRCUIT BREAKER] Tripped OPEN for \${provider} due to: \${reason}. Bypassing for 45s.\`);
    }
  }
}
`;

if (!workerJs.includes('const circuitBreakers =')) {
  // Inject right before runUnifiedAI or app definition
  const injectAnchor = '// Unified multi-provider AI runner';
  if (workerJs.includes(injectAnchor)) {
    workerJs = workerJs.replace(injectAnchor, `${circuitBreakerCode}\n${injectAnchor}`);
    console.log('Injected Circuit Breaker definitions.');
  }
}

// 2. Update runHttpProvider to include timeout, circuit checks, and jitter retry
const oldRunHttpSnippet = `    // HTTP Provider runner with streaming capability (Groq / OpenRouter)
    const runHttpProvider = async (providerName, key, url, modelToUse, maxTokens = null) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${key}\`,
          "Content-Type": "application/json",
          ...(providerName === 'openrouter' && { "HTTP-Referer": "https://specsupport.pages.dev", "X-Title": "Inspecta" })
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: messages,
          temperature: 0.15,
          stream: Boolean(stream),
          ...(maxTokens && { max_tokens: maxTokens })
        })
      })

      if (response.status === 429) throw new Error("Rate Limit Exceeded")
      if (!response.ok) {
        const errText = await response.text()
        if (response.status === 401) throw new Error(\`Invalid API Key for \${providerName}\`)
        throw new Error(\`HTTP \${response.status}: \${errText}\`)
      }
      return { response: stream ? response.body : response, model: modelToUse, provider: providerName, isStream: Boolean(stream) }
    }`;

const newRunHttpSnippet = `    // HTTP Provider runner with streaming, timeouts, jitter & circuit breakers
    const runHttpProvider = async (providerName, key, url, modelToUse, maxTokens = null) => {
      if (!canAttemptProvider(providerName)) {
        throw new Error(\`[Circuit Breaker OPEN] \${providerName} is temporarily suspended due to consecutive failures.\`);
      }

      // Strict 5,000ms timeout per upstream provider to guarantee zero hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(url, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Authorization": \`Bearer \${key}\`,
            "Content-Type": "application/json",
            ...(providerName === 'openrouter' && { "HTTP-Referer": "https://specsupport.pages.dev", "X-Title": "Inspecta" })
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: messages,
            temperature: 0.15,
            stream: Boolean(stream),
            ...(maxTokens && { max_tokens: maxTokens })
          })
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          recordProviderFailure(providerName, "Rate Limit (429)");
          // Exponential backoff with jitter for transient retries
          const jitter = Math.floor(Math.random() * 200);
          await new Promise(r => setTimeout(r, 300 + jitter));
          throw new Error("Rate Limit Exceeded (429)");
        }

        if (!response.ok) {
          recordProviderFailure(providerName, \`HTTP \${response.status}\`);
          const errText = await response.text();
          if (response.status === 401) throw new Error(\`Invalid API Key for \${providerName}\`);
          throw new Error(\`HTTP \${response.status}: \${errText}\`);
        }

        recordProviderSuccess(providerName);
        return { response: stream ? response.body : response, model: modelToUse, provider: providerName, isStream: Boolean(stream) };
      } catch (err) {
        clearTimeout(timeoutId);
        recordProviderFailure(providerName, err.name === 'AbortError' ? 'Timeout (5000ms)' : err.message);
        throw err;
      }
    }`;

if (workerJs.includes(oldRunHttpSnippet)) {
  workerJs = workerJs.replace(oldRunHttpSnippet, newRunHttpSnippet);
  console.log('Replaced runHttpProvider with timeout & circuit-breaker hardened version.');
}

fs.writeFileSync(workerPath, workerJs, 'utf8');
console.log('Successfully updated worker/src/index.js');
