const fs = require('fs');

// ==========================================
// 1. UPDATE worker/src/index.js
// ==========================================
let worker = fs.readFileSync('worker/src/index.js', 'utf8');

// Update coreInspectionDirectives:
// - MCQ is STRICTLY OPTIONAL LAST RESORT for genuine equal-probability conflicts
// - Direct definitive answers first (no forced question interrogations)
// - Forward-looking follow-up chips
const oldDirectivesRegex = /CORE INSPECTION DIRECTIVES:[\s\S]*?5\) False indication diagnostic or rig-floor trap\./;

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

2. DIRECT DEFINITIVE ANSWERS FIRST (NO INTERROGATION):
Provide the direct, authoritative technical verdict immediately. DO NOT interrogate the user with a dead list of clarifying questions. If the code has different service tiers (e.g. Normal vs. Severe Cyclic vs. Sour Service), state the specific thresholds for each clearly in the explanation or comparative table so the engineer gets the answer right away.

3. OPTIONAL MCQ CONFLICT RESOLUTION (STRICT LAST RESORT ONLY):
Multiple-Choice Questions (MCQs) are STRICTLY an optional fallback. Use MCQs ONLY when you encounter an irreconcilable conflict between two or more mutually exclusive code options having equal probability (e.g., a 50/50 probability conflict where two standards directly contradict each other or the component category is split between two equal paths).
If there is NO genuine equal-probability conflict, DO NOT output MCQs! Give the definitive verdict directly.
Only when an equal-probability conflict exists, append:
<!--MCQ: [
  {
    "question": "Which conflicting specification applies?",
    "options": ["Standard Option A", "Standard Option B"]
  }
]-->

4. FORWARD-LOOKING CLICKABLE FOLLOW-UP QUESTIONS:
At the very end of your response, ALWAYS include 4 to 5 forward-looking question chips in exactly this format:
<!--FOLLOWUPS: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]-->
CRITICAL RULES FOR FOLLOW-UP CHIPS:
- These are hyperlinked questions that the user can click to ask YOU subsequent technical deep-dives.
- NEVER repeat or rephrase the user's original query.
- NEVER ask the user for information in these chips.`;

worker = worker.replace(oldDirectivesRegex, newDirectives);

// In /api/ask: remove the aggressive automatic MCQ fallback injection so MCQ is truly optional
const oldMcqFallbackRegex = /\/\/ Smart MCQ fallback generator if clarifying questions exist[\s\S]*?if \(mcqQuestions\.length === 0 && answer\.includes\('Clarifying Questions'\)\) \{[\s\S]*?\}\s*\}/;

const newMcqHandling = `// Extract MCQ questions ONLY if model explicitly flagged an equal-probability conflict
    // (MCQ is strictly an optional last resort tool)
    // No aggressive fallback injection: if the model answered definitively, do NOT show MCQs.`;

worker = worker.replace(oldMcqFallbackRegex, newMcqHandling);

fs.writeFileSync('worker/src/index.js', worker, 'utf8');
console.log('Successfully updated worker/src/index.js');

// ==========================================
// 2. UPDATE index.html
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// Update CSS for followup-chip and clickable links
const oldChipCssRegex = /\.followup-chip\s*\{[\s\S]*?\.followup-chip:hover\s*\{[\s\S]*?\}/;

const newChipCss = `.followup-chip {
            background: var(--gemini-surface);
            border: 1px solid rgba(138, 180, 248, 0.35);
            color: var(--gemini-blue-light);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer !important;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            user-select: none;
        }
        .followup-chip:hover {
            background: rgba(26, 115, 232, 0.18);
            border-color: var(--gemini-blue-light);
            color: #FFFFFF;
            transform: translateY(-1px);
            box-shadow: 0 3px 8px rgba(26, 115, 232, 0.25);
        }
        .followup-chip:active {
            transform: translateY(0);
        }
        .followup-chip .chip-arrow {
            color: var(--gemini-blue-light);
            font-weight: 700;
        }
        .clickable-q-link {
            color: var(--gemini-blue-light) !important;
            cursor: pointer !important;
            text-decoration: underline !important;
            display: inline-block;
            margin: 4px 0;
            transition: all 0.15s;
        }
        .clickable-q-link:hover {
            color: #FFFFFF !important;
            background: rgba(26, 115, 232, 0.2);
            padding: 2px 6px;
            border-radius: 4px;
        }`;

html = html.replace(oldChipCssRegex, newChipCss);

// Update appendMessage logic:
// 1. Follow-up chips are real <button> elements with clear clickable interaction
// 2. Make ANY list items under questions clickable as well so NOTHING is ever just dead text!
const oldFollowupLogic = `// Suggested Next Question Chips
                if (followups && followups.length > 0) {
                    const chipsWrap = document.createElement('div');
                    chipsWrap.className = 'followups-container';
                    followups.forEach(q => {
                        const chip = document.createElement('div');
                        chip.className = 'followup-chip';
                        chip.innerHTML = \`↗ \${q}\`;
                        chip.onclick = () => sendMessage(q);
                        chipsWrap.appendChild(chip);
                    });
                    body.appendChild(chipsWrap);
                }`;

const newFollowupLogic = `// Suggested Next Question Chips (Explicitly clickable buttons)
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
                });`;

html = html.replace(oldFollowupLogic, newFollowupLogic);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html with hyperlinked clickable questions.');
