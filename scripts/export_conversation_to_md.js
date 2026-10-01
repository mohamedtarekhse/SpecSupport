/**
 * SpecSupport Full Conversation Exporter
 * Dynamically exports the complete uncompressed dialogue transcript from transcript_full.jsonl
 * to FULL_CONVERSATION_HISTORY.md with Table of Contents, timestamps, and tool summaries.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONVERSATION_ID = '831bfcb2-41c2-4a30-92da-937c17c7849a';
const BRAIN_DIR = path.join(process.env.USERPROFILE || 'C:\\Users\\MT', '.gemini', 'antigravity', 'brain', CONVERSATION_ID);
const TRANSCRIPT_FULL_PATH = path.join(BRAIN_DIR, '.system_generated', 'logs', 'transcript_full.jsonl');
const TRANSCRIPT_COMPACT_PATH = path.join(BRAIN_DIR, '.system_generated', 'logs', 'transcript.jsonl');
const OUTPUT_MD_PATH = path.join(__dirname, '..', 'FULL_CONVERSATION_HISTORY.md');

async function exportConversation() {
    console.log(`Starting export from: ${TRANSCRIPT_FULL_PATH}`);
    if (!fs.existsSync(TRANSCRIPT_FULL_PATH)) {
        console.error(`Error: Transcript file not found at ${TRANSCRIPT_FULL_PATH}`);
        process.exit(1);
    }

    const inputStream = fs.createReadStream(TRANSCRIPT_FULL_PATH, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: inputStream, crlfDelay: Infinity });

    const turns = [];
    let currentTurn = null;

    for await (const line of rl) {
        if (!line.trim()) continue;
        let entry;
        try {
            entry = JSON.parse(line);
        } catch (e) {
            continue;
        }

        if (entry.type === 'USER_INPUT' && entry.source === 'USER_EXPLICIT') {
            if (currentTurn) {
                turns.push(currentTurn);
            }
            currentTurn = {
                turnIndex: turns.length + 1,
                timestamp: entry.created_at || new Date().toISOString(),
                userRaw: entry.content || '',
                userPrompt: cleanUserPrompt(entry.content || ''),
                media: entry.media || [],
                actions: [],
                responses: []
            };
        } else if (currentTurn) {
            // Collect tool calls
            if (entry.tool_calls && Array.isArray(entry.tool_calls)) {
                for (const call of entry.tool_calls) {
                    const name = call.name || 'tool';
                    const summary = call.args?.toolSummary || call.args?.toolAction || call.args?.Instruction || call.args?.CommandLine || '';
                    currentTurn.actions.push({ name, summary });
                }
            }
            // Collect assistant messages
            if (entry.type === 'PLANNER_RESPONSE' && entry.content && entry.content.trim().length > 0) {
                // Deduplicate identical immediate contents if any
                const lastResp = currentTurn.responses[currentTurn.responses.length - 1];
                if (!lastResp || lastResp.content.trim() !== entry.content.trim()) {
                    currentTurn.responses.push({
                        timestamp: entry.created_at || '',
                        content: entry.content.trim()
                    });
                }
            }
        }
    }

    if (currentTurn) {
        turns.push(currentTurn);
    }

    console.log(`Parsed ${turns.length} turns. Building Markdown document...`);

    const outStream = fs.createWriteStream(OUTPUT_MD_PATH, { encoding: 'utf8' });

    // Header
    outStream.write(`# SpecSupport Engineering System — Full Conversation Archive\n\n`);
    outStream.write(`> **Conversation ID:** \`${CONVERSATION_ID}\`  \n`);
    outStream.write(`> **Export Timestamp:** \`${new Date().toISOString()}\`  \n`);
    outStream.write(`> **Total Dialogue Turns:** \`${turns.length}\`  \n`);
    outStream.write(`> **Storage:** Cloudflare D1 (\`inspection-db\`), Vectorize (\`inspecta-index\`), Pages (\`final.specsupport.pages.dev\`)  \n`);
    outStream.write(`> **Scope:** Complete architectural, database, edge worker, and multi-standard genome development log.  \n\n`);
    outStream.write(`---\n\n`);

    // Table of Contents
    outStream.write(`## 📑 Chronological Table of Contents\n\n`);
    turns.forEach(t => {
        let snippet = t.userPrompt.replace(/\r?\n/g, ' ').slice(0, 100).trim();
        if (t.userPrompt.length > 100) snippet += '...';
        // Clean markdown characters from TOC anchor title
        const cleanSnippet = snippet.replace(/[\[\]\(\)*`#]/g, '').trim() || `Turn ${t.turnIndex}`;
        const dateStr = t.timestamp ? t.timestamp.replace('T', ' ').slice(0, 16) : '';
        outStream.write(`- [**Turn ${t.turnIndex}** (${dateStr}) — ${cleanSnippet}](#turn-${t.turnIndex})\n`);
    });
    outStream.write(`\n---\n\n`);

    // Turns Content
    for (const t of turns) {
        outStream.write(`### <a id="turn-${t.turnIndex}"></a> Turn ${t.turnIndex} — [${t.timestamp || 'N/A'}]\n\n`);

        // User Section
        outStream.write(`#### 👤 USER\n\n`);
        outStream.write(`${t.userPrompt}\n\n`);

        if (t.media && t.media.length > 0) {
            outStream.write(`*Attachments/Media:* ${t.media.map(m => m.uri || m.mime_type).join(', ')}\n\n`);
        }

        // Actions Summary
        if (t.actions.length > 0) {
            // Group duplicate tool actions
            const uniqueActions = [];
            const seen = new Set();
            for (const a of t.actions) {
                const key = `${a.name}:${a.summary}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueActions.push(a);
                }
            }
            if (uniqueActions.length > 0) {
                outStream.write(`<details>\n<summary><b>🛠️ Tool Actions & Executions (${uniqueActions.length})</b></summary>\n\n`);
                uniqueActions.forEach(act => {
                    const desc = act.summary ? `— \`${act.summary}\`` : '';
                    outStream.write(`- **${act.name}** ${desc}\n`);
                });
                outStream.write(`\n</details>\n\n`);
            }
        }

        // Assistant Responses
        if (t.responses.length > 0) {
            outStream.write(`#### 🤖 SPECSUPPORT ASSISTANT\n\n`);
            t.responses.forEach((resp, rIdx) => {
                if (t.responses.length > 1) {
                    outStream.write(`*(Response Part ${rIdx + 1}/${t.responses.length})*\n\n`);
                }
                outStream.write(`${resp.content}\n\n`);
            });
        } else {
            outStream.write(`*No direct textual response recorded (Action/Tool only turn).*\n\n`);
        }

        outStream.write(`---\n\n`);
    }

    outStream.end();
    console.log(`Export completed successfully! Output saved to:\n${OUTPUT_MD_PATH}`);
}

function cleanUserPrompt(raw) {
    if (!raw) return '';
    let text = typeof raw === 'string' ? raw : JSON.stringify(raw);
    
    // Check if wrapped in <USER_REQUEST>
    const userReqMatch = text.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
    if (userReqMatch) {
        return userReqMatch[1].trim();
    }
    
    // Check if there is context summary before it
    if (text.includes('</CONTEXT_SUMMARY>')) {
        const parts = text.split('</CONTEXT_SUMMARY>');
        return parts[parts.length - 1].trim();
    }
    
    return text.trim();
}

exportConversation().catch(err => {
    console.error('Export Error:', err);
    process.exit(1);
});
