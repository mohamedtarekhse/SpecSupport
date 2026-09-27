const fs = require('fs');

// ==========================================
// 1. UPDATE worker/src/index.js
// ==========================================
let worker = fs.readFileSync('worker/src/index.js', 'utf8');

// Update coreInspectionDirectives: emphasize that body is strictly technical, followups strictly at tail
const oldDirectivesMarker = `CORE INSPECTION DIRECTIVES:
1. MANDATORY ZERO-CLICK VERDICT CARD:`;

const newDirectives = `CORE INSPECTION DIRECTIVES:
1. MANDATORY ZERO-CLICK VERDICT CARD:
Start your response IMMEDIATELY with the following high-contrast markdown block (do NOT write introductory conversational fluff before it):

### ⚖️ GOVERNING CODE & CLAUSE VERDICT
- **Primary Code & Edition**: [Exact standard, e.g. ASME B31.3 (2022) / API 1104 (22nd Ed.)]
- **Governing Clause / Table**: [Exact paragraph or table, e.g. Table 341.3.2 / Clause 9.3.9]
- **Service Condition / Component**: [e.g. Normal Fluid Service / Circumferential Butt Weld]
- **✅ Immediate Acceptance Limit**: [Exact numerical threshold, formula, or dimensions for baseline]
- **❌ Mandatory Rejection Criteria**: [Exact exceedance condition or zero-tolerance trigger]
- **🔬 Required NDT Method & Standard**: [e.g. Visual per AWS B1.11 / RT per ASME V Art 2]
- **📜 Personnel Qualification**: [e.g. ASNT SNT-TC-1A Level II / ASME IX Welder]

2. DEFINITIVE TECHNICAL ANSWERS IN RESPONSE BODY (NO QUESTION LISTS IN BODY):
The body of your response must contain ONLY engineering verdicts, metallurgical explanations, calculations, tables, and quality recommendations.
DO NOT write lists of clarifying questions or follow-up questions inside the body of your response.
If different service categories or wall thicknesses apply, state the exact limits for each in a clear table or in the explanation.

3. OPTIONAL MCQ CONFLICT RESOLUTION (STRICT LAST RESORT ONLY):
MCQ is STRICTLY an optional fallback. Use it ONLY when you encounter an irreconcilable conflict where two or more options have equal probability (50/50 conflict between two opposing standards).
In ordinary engineering queries, DO NOT emit any MCQ block. Answer definitively.
Only if you are genuinely lost due to an equal-probability conflict, append at the very tail:
<!--MCQ: [
  {
    "question": "Which conflicting specification applies?",
    "options": ["Option A", "Option B"]
  }
]-->

4. FORWARD-LOOKING CLICKABLE FOLLOW-UP QUESTIONS (STRICTLY AT TAIL):
At the very end of your response (after all body text), append 4 to 5 forward-looking question chips in exactly this format:
<!--FOLLOWUPS: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]-->
CRITICAL RULES FOR FOLLOW-UP CHIPS:
- DO NOT write these questions as plain markdown text inside the body.
- These are hyperlinked questions for the USER to click to ask YOU subsequent technical deep-dives.
- NEVER repeat or rephrase the user's original query.
- NEVER ask the user questions in these chips.`;

worker = worker.replace(/CORE INSPECTION DIRECTIVES:[\s\S]*?NEVER ask the user questions in these chips\./, newDirectives);

// Update /api/ask extraction logic to use multi-line regex and clean stray question blocks from answer body
const oldExtractionBlock = `    // Extract MCQ questions if present
    let mcqQuestions = []
    const mcqMatch = answer.match(/<!--MCQ:\\s*(\\[\\s*\\{[\\s\\S]*?\\}\\s*\\])\\s*-->/)
    if (mcqMatch) {
      try {
        mcqQuestions = JSON.parse(mcqMatch[1])
        answer = answer.replace(mcqMatch[0], '').trim()
      } catch(e){}
    }

    // Extract follow-up question chips if present
    let suggestedQuestions = []
    const followupMatch = answer.match(/<!--FOLLOWUPS:\\s*(\\[.*?\\])\\s*-->/)
    if (followupMatch) {
      try {
        suggestedQuestions = JSON.parse(followupMatch[1])
        answer = answer.replace(followupMatch[0], '').trim()
      } catch(e){}
    }`;

const newExtractionBlock = `    // 1. Extract optional MCQ questions if model flagged a 50/50 conflict (Multi-line safe)
    let mcqQuestions = []
    const mcqMatch = answer.match(/<!--MCQ:\\s*(\\[[\\s\\S]*?\\])\\s*-->/i)
    if (mcqMatch) {
      try {
        mcqQuestions = JSON.parse(mcqMatch[1])
      } catch(e){}
      answer = answer.replace(mcqMatch[0], '').trim()
    }

    // 2. Extract follow-up question chips (Multi-line safe)
    let suggestedQuestions = []
    const followupMatch = answer.match(/<!--FOLLOWUPS:\\s*(\\[[\\s\\S]*?\\])\\s*-->/i)
    if (followupMatch) {
      try {
        suggestedQuestions = JSON.parse(followupMatch[1])
      } catch(e){}
      answer = answer.replace(followupMatch[0], '').trim()
    }

    // 3. Remove any remaining HTML comments from answer
    answer = answer.replace(/<!--[\\s\\S]*?-->/g, '').trim()

    // 4. Strip any dead question lists from the body of the response so they don't pollute the body
    answer = answer.replace(/###\\s*❓?\\s*(?:Clarifying|Follow-up|Suggested|Potential)\\s*Questions[\\s\\S]*?(?=\\n###|\\n\\*\\*Detailed|\\n\\*\\*Quality|\\n\\*\\*1\\.|\\n\\*\\*The Code|$)/gi, '').trim()`;

worker = worker.replace(oldExtractionBlock, newExtractionBlock);

fs.writeFileSync('worker/src/index.js', worker, 'utf8');
console.log('Successfully updated worker/src/index.js with robust extraction and body cleaning.');

// ==========================================
// 2. UPDATE index.html
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// Update appendMessage so that:
// - text is rendered in .message-content
// - mcqs, followups, sources, and toolbar are appended in a dedicated .message-tail container
const oldAppendMessageBlock = `            if (role === 'ai') {
                body.innerHTML = marked.parse(text);

                // Sources Accordion
                if (sources && sources.length > 0) {
                    const srcBox = document.createElement('details');
                    srcBox.className = 'sources-accordion';
                    let listItems = sources.map(s => \`<li><strong>\${s.standard}</strong>: \${s.clause}</li>\`).join('');
                    srcBox.innerHTML = \`<summary>📖 Verified Sources Cited (\${sources.length})</summary><ul>\${listItems}</ul>\`;
                    body.appendChild(srcBox);
                }

                // Continue Generating Button
                if (canContinue) {
                    const contBtn = document.createElement('button');
                    contBtn.className = 'continue-btn';
                    contBtn.innerHTML = '▶ Continue generating...';
                    contBtn.onclick = () => {
                        contBtn.remove();
                        sendMessage("Continue from exactly where you left off, preserving complete technical continuity.");
                    };
                    body.appendChild(contBtn);
                }

                
                // Interactive MCQ Refinement Card
                if (mcqs && mcqs.length > 0) {
                    const mcqCard = document.createElement('div');
                    mcqCard.className = 'interactive-mcq-card';
                    mcqCard.innerHTML = \`
                        <div class="mcq-card-header">
                            <span class="mcq-badge">Interactive Refinement</span>
                            <span>Select parameters to pinpoint the exact clause verdict:</span>
                        </div>
                    \`;

                    const selectedParams = {};

                    mcqs.forEach((mcq, qIdx) => {
                        const qBlock = document.createElement('div');
                        qBlock.className = 'mcq-question-block';
                        qBlock.innerHTML = \`<div class="mcq-question-title">\${qIdx + 1}. \${mcq.question}</div>\`;

                        const grid = document.createElement('div');
                        grid.className = 'mcq-options-grid';

                        mcq.options.forEach(opt => {
                            const pill = document.createElement('button');
                            pill.className = 'mcq-option-pill';
                            pill.textContent = opt;
                            pill.onclick = () => {
                                // Deselect siblings
                                grid.querySelectorAll('.mcq-option-pill').forEach(p => p.classList.remove('selected'));
                                pill.classList.add('selected');
                                selectedParams[mcq.question] = opt;

                                // Enable refine button
                                const refineBtn = mcqCard.querySelector('.mcq-refine-btn');
                                if (refineBtn) refineBtn.disabled = false;
                            };
                            grid.appendChild(pill);
                        });

                        qBlock.appendChild(grid);
                        mcqCard.appendChild(qBlock);
                    });

                    const actionsBar = document.createElement('div');
                    actionsBar.className = 'mcq-actions-bar';
                    const refineBtn = document.createElement('button');
                    refineBtn.className = 'mcq-refine-btn';
                    refineBtn.innerHTML = '⚡ Refine Code Verdict with Selected Options';
                    refineBtn.disabled = true;
                    refineBtn.onclick = () => {
                        refineBtn.disabled = true;
                        const paramList = Object.entries(selectedParams).map(([k, v]) => \`- \${k}: \${v}\`).join('\\n');
                        const refineQuery = \`Refining code acceptance with the following verified project parameters:\\n\${paramList}\\n\\nPlease provide the final, exact clause verdict and precise numerical acceptance thresholds.\`;
                        sendMessage(refineQuery);
                    };
                    actionsBar.appendChild(refineBtn);
                    mcqCard.appendChild(actionsBar);

                    body.appendChild(mcqCard);
                }

                // Suggested Next Question Chips (Explicitly clickable buttons)
                if (followups && followups.length > 0) {
                    const chipsWrap = document.createElement('div');
                    chipsWrap.className = 'followups-container';
                    followups.forEach(q => {
                        const chip = document.createElement('button');
                        chip.type = 'button';
                        chip.className = 'followup-chip';
                        chip.setAttribute('role', 'button');
                        chip.setAttribute('tabindex', '0');
                        chip.innerHTML = \`<span class="chip-arrow">↗</span> <span>\${q}</span>\`;
                        chip.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            sendMessage(q);
                        };
                        chipsWrap.appendChild(chip);
                    });
                    body.appendChild(chipsWrap);
                }

                // Auto-hyperlink any clarifying or follow-up question text inside markdown so nothing is dead text
                body.querySelectorAll('li').forEach(li => {
                    const txt = li.textContent.trim();
                    if (txt.endsWith('?') || txt.includes('What is') || txt.includes('Which code') || txt.includes('What are')) {
                        li.classList.add('clickable-q-link');
                        li.title = "Click to ask Inspecta this question";
                        li.onclick = (e) => {
                            e.preventDefault();
                            sendMessage(txt);
                        };
                    }
                });

                // Action Toolbar (Copy, Upvote, Downvote, Export NCR)
                const toolbar = document.createElement('div');
                toolbar.className = 'response-toolbar';
                toolbar.innerHTML = \`
                    <button class="tool-btn" onclick="copyAnswer(this, \\\`\${encodeURIComponent(text)}\\\`)">📋 Copy</button>
                    <button class="tool-btn" onclick="alert('Thank you for your feedback!')">👍</button>
                    <button class="tool-btn" onclick="alert('Feedback noted for engineering review.')">👎</button>
                    <button class="tool-btn" onclick="exportNCR(\\\`\${encodeURIComponent(text)}\\\`)">📑 Export NCR</button>
                \`;
                body.appendChild(toolbar);
            } else {
                body.textContent = text;
            }`;

const newAppendMessageBlock = `            if (role === 'ai') {
                // 1. Clean any stray question headings from the text so body is purely technical
                let cleanText = text
                    .replace(/###\\s*❓?\\s*(?:Clarifying|Follow-up|Suggested|Potential)\\s*Questions[\\s\\S]*?(?=\\n###|\\n\\*\\*Detailed|\\n\\*\\*Quality|\\n\\*\\*1\\.|\\n\\*\\*The Code|$)/gi, '')
                    .replace(/<!--[\\s\\S]*?-->/g, '')
                    .trim();

                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
                contentDiv.innerHTML = marked.parse(cleanText);
                body.appendChild(contentDiv);

                // 2. Dedicated Response Tail Container (positioned strictly at the bottom)
                const tailDiv = document.createElement('div');
                tailDiv.className = 'message-tail';

                // Continue Generating Button
                if (canContinue) {
                    const contBtn = document.createElement('button');
                    contBtn.className = 'continue-btn';
                    contBtn.innerHTML = '▶ Continue generating...';
                    contBtn.onclick = () => {
                        contBtn.remove();
                        sendMessage("Continue from exactly where you left off, preserving complete technical continuity.");
                    };
                    tailDiv.appendChild(contBtn);
                }

                // Interactive MCQ Refinement Card (Only rendered at tail if conflict exists)
                if (mcqs && mcqs.length > 0) {
                    const mcqCard = document.createElement('div');
                    mcqCard.className = 'interactive-mcq-card';
                    mcqCard.innerHTML = \`
                        <div class="mcq-card-header">
                            <span class="mcq-badge">Specification Conflict Fork</span>
                            <span>Select applicable project path to finalize verdict:</span>
                        </div>
                    \`;

                    const selectedParams = {};

                    mcqs.forEach((mcq, qIdx) => {
                        const qBlock = document.createElement('div');
                        qBlock.className = 'mcq-question-block';
                        qBlock.innerHTML = \`<div class="mcq-question-title">\${qIdx + 1}. \${mcq.question}</div>\`;

                        const grid = document.createElement('div');
                        grid.className = 'mcq-options-grid';

                        mcq.options.forEach(opt => {
                            const pill = document.createElement('button');
                            pill.className = 'mcq-option-pill';
                            pill.textContent = opt;
                            pill.onclick = () => {
                                grid.querySelectorAll('.mcq-option-pill').forEach(p => p.classList.remove('selected'));
                                pill.classList.add('selected');
                                selectedParams[mcq.question] = opt;

                                const refineBtn = mcqCard.querySelector('.mcq-refine-btn');
                                if (refineBtn) refineBtn.disabled = false;
                            };
                            grid.appendChild(pill);
                        });

                        qBlock.appendChild(grid);
                        mcqCard.appendChild(qBlock);
                    });

                    const actionsBar = document.createElement('div');
                    actionsBar.className = 'mcq-actions-bar';
                    const refineBtn = document.createElement('button');
                    refineBtn.className = 'mcq-refine-btn';
                    refineBtn.innerHTML = '⚡ Resolve Conflict with Selected Path';
                    refineBtn.disabled = true;
                    refineBtn.onclick = () => {
                        refineBtn.disabled = true;
                        const paramList = Object.entries(selectedParams).map(([k, v]) => \`- \${k}: \${v}\`).join('\\n');
                        const refineQuery = \`Resolving specification conflict with the following verified project condition:\\n\${paramList}\\n\\nPlease provide the final verified clause verdict.\`;
                        sendMessage(refineQuery);
                    };
                    actionsBar.appendChild(refineBtn);
                    mcqCard.appendChild(actionsBar);

                    tailDiv.appendChild(mcqCard);
                }

                // Follow-up Question Chips (Strictly positioned at the tail of the response)
                if (followups && followups.length > 0) {
                    const chipsWrap = document.createElement('div');
                    chipsWrap.className = 'followups-container';
                    followups.forEach(q => {
                        const chip = document.createElement('button');
                        chip.type = 'button';
                        chip.className = 'followup-chip';
                        chip.setAttribute('role', 'button');
                        chip.setAttribute('tabindex', '0');
                        chip.innerHTML = \`<span class="chip-arrow">↗</span> <span>\${q}</span>\`;
                        chip.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            sendMessage(q);
                        };
                        chipsWrap.appendChild(chip);
                    });
                    tailDiv.appendChild(chipsWrap);
                }

                // Sources Accordion (at tail)
                if (sources && sources.length > 0) {
                    const srcBox = document.createElement('details');
                    srcBox.className = 'sources-accordion';
                    let listItems = sources.map(s => \`<li><strong>\${s.standard}</strong>: \${s.clause}</li>\`).join('');
                    srcBox.innerHTML = \`<summary>📖 Verified Sources Cited (\${sources.length})</summary><ul>\${listItems}</ul>\`;
                    tailDiv.appendChild(srcBox);
                }

                // Action Toolbar (at tail)
                const toolbar = document.createElement('div');
                toolbar.className = 'response-toolbar';
                toolbar.innerHTML = \`
                    <button class="tool-btn" onclick="copyAnswer(this, \\\`\${encodeURIComponent(cleanText)}\\\`)">📋 Copy</button>
                    <button class="tool-btn" onclick="alert('Thank you for your feedback!')">👍</button>
                    <button class="tool-btn" onclick="alert('Feedback noted for engineering review.')">👎</button>
                    <button class="tool-btn" onclick="exportNCR(\\\`\${encodeURIComponent(cleanText)}\\\`)">📑 Export NCR</button>
                \`;
                tailDiv.appendChild(toolbar);

                body.appendChild(tailDiv);
            } else {
                body.textContent = text;
            }`;

html = html.replace(oldAppendMessageBlock, newAppendMessageBlock);

// Add CSS for .message-tail
const tailCss = `
        /* Message Tail / Footer Container */
        .message-tail {
            margin-top: 18px;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        :root.light-mode .message-tail {
            border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
`;

if (!html.includes('.message-tail {')) {
  html = html.replace('/* Interactive Multiple-Choice Questions (MCQ) Card */', tailCss + '\n        /* Interactive Multiple-Choice Questions (MCQ) Card */');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html with dedicated .message-tail container.');
