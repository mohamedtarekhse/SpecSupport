const fs = require('fs');

// ==========================================
// 1. UPDATE WORKER (worker/src/index.js)
// ==========================================
let worker = fs.readFileSync('worker/src/index.js', 'utf8');

// Update coreInspectionDirectives in worker to mandate MCQ block
const oldDirectivesMarker = `CORE INSPECTION DIRECTIVES:
1. MANDATORY ZERO-CLICK VERDICT CARD:`;

const newDirectives = `CORE INSPECTION DIRECTIVES:
1. MANDATORY ZERO-CLICK VERDICT CARD:
Start your response IMMEDIATELY with the following high-contrast markdown block (do NOT write introductory conversational fluff before it):

### ⚖️ GOVERNING CODE & CLAUSE VERDICT
- **Primary Code & Edition**: [Exact standard, e.g. ASME B31.3 (2022) / API 1104 (22nd Ed.)]
- **Governing Clause / Table**: [Exact paragraph or table, e.g. Table 341.3.2 / Clause 9.3.9]
- **Service Condition / Component**: [e.g. Normal Fluid Service / Circumferential Butt Weld]
- **✅ Immediate Acceptance Limit**: [Exact numerical threshold, formula, or dimensions]
- **❌ Mandatory Rejection Criteria**: [Exact exceedance condition or zero-tolerance trigger]
- **🔬 Required NDT Method & Standard**: [e.g. Visual per AWS B1.11 / RT per ASME V Art 2]
- **📜 Personnel Qualification**: [e.g. ASNT SNT-TC-1A Level II / ASME IX Welder]

2. STRICT ANTI-ASSUMPTION RULE (DO NOT GUESS MISSING VARIABLES):
In welding and NDT quality inspection, assuming a fluid category, wall thickness, or joint type without verification can cause catastrophic field failures or illegal certifications.
If the user's prompt omits critical parameters (e.g. wall thickness, fluid category, design code, or operating temperature):
- Provide the baseline verdict or multi-code comparison for standard cases.
- Add a clear warning callout: '> ⚠️ **Missing Inspection Parameters**: [State missing inputs]'
- You MUST ask a MAXIMUM OF 3 precise, targeted clarifying questions to pinpoint the exact clause (under '### ❓ Clarifying Questions for Precise Acceptance:').

3. MULTI-CODE COMPARISON MATRIX FOR BROAD / AMBIGUOUS QUERIES:
If the user's query is broad or applies across multiple industry sectors (e.g. general questions about "undercut", "porosity", "hydrotest pressure", or "fatigue cracks"), DO NOT assume one code. Provide a **Cross-Sector Comparison Matrix Table** on the first prompt comparing:
- ASME B31.3 (Process Plant Piping)
- API 1104 (Cross-Country Pipelines)
- ASME VIII Div 1 (Pressure Vessels)
- AWS D1.1 (Structural Steel)
- API RP 7G-2 / API 5CT (Drill Stem & Casing if relevant)

4. INTERACTIVE MULTIPLE-CHOICE QUESTIONS (MCQ) FOR REFINEMENT:
Whenever you ask clarifying questions (up to 3 questions) OR when key parameters are needed to refine the verdict, you MUST ALWAYS append an interactive multiple-choice question block at the very end formatted as:
<!--MCQ: [
  {
    "question": "What is the specified wall thickness (tw)?",
    "options": ["tw ≤ 1/2 in. (12.7 mm)", "1/2 in. < tw ≤ 1 in. (25.4 mm)", "tw > 1 in. Heavy Wall", "Standard Schedule 40"]
  },
  {
    "question": "What is the fluid service condition?",
    "options": ["Normal Fluid Service", "Severe Cyclic Conditions", "Category M (Toxic/Lethal)", "Category D (Utility/Water)"]
  },
  {
    "question": "Which governing standard applies to your project?",
    "options": ["ASME B31.3 (Process Piping)", "API 1104 (Cross-Country)", "ASME VIII (Pressure Vessel)", "AWS D1.1 (Structural)"]
  }
]-->

5. DYNAMIC FOLLOW-UP QUESTION CHIPS:
At the very end of your response, ALWAYS include 4 to 5 highly relevant, actionable follow-up question chips in exactly this format:
<!--FOLLOWUPS: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]-->
Ensure these chips cover:
1) Measuring tool & calibration required,
2) Disposition upon rejection (grind/repair vs cut-out),
3) Cross-code comparison or alternative NDT method,
4) Personnel qualification or ITP hold point,
5) False indication diagnostic or rig-floor trap.`;

worker = worker.replace(/CORE INSPECTION DIRECTIVES:[\s\S]*?5\) False indication diagnostic or rig-floor trap\./, newDirectives);

// Update /api/ask to extract MCQ JSON block and provide fallback MCQ generator
const oldApiAskParsing = `    // Extract follow-up question chips if present
    let suggestedQuestions = []
    const followupMatch = answer.match(/<!--FOLLOWUPS:\\s*(\\[.*?\\])\\s*-->/)
    if (followupMatch) {
      try {
        suggestedQuestions = JSON.parse(followupMatch[1])
        answer = answer.replace(followupMatch[0], '').trim()
      } catch(e){}
    }`;

const newApiAskParsing = `    // Extract MCQ questions if present
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
    }

    // Smart MCQ fallback generator if clarifying questions exist but model omitted JSON
    if (mcqQuestions.length === 0 && answer.includes('Clarifying Questions')) {
      if (answer.toLowerCase().includes('thickness') || answer.toLowerCase().includes('wall')) {
        mcqQuestions.push({
          question: "Nominal Wall Thickness (tw)",
          options: ["tw ≤ 1/2 in. (12.7 mm)", "1/2 in. < tw ≤ 1.0 in.", "tw > 1.0 in. (Heavy Wall)", "Schedule 40 Standard"]
        })
      }
      if (answer.toLowerCase().includes('service') || answer.toLowerCase().includes('cyclic')) {
        mcqQuestions.push({
          question: "Fluid Service Condition",
          options: ["Normal Fluid Service", "Severe Cyclic Conditions", "Category M (Toxic/Lethal)", "Category D (Low Pressure)"]
        })
      }
      if (answer.toLowerCase().includes('code') || answer.toLowerCase().includes('standard') || answer.toLowerCase().includes('asme')) {
        mcqQuestions.push({
          question: "Governing Code",
          options: ["ASME B31.3 (Process Piping)", "API 1104 (Cross-Country)", "ASME VIII Div 1 (Vessel)", "AWS D1.1 (Structural)"]
        })
      }
    }`;

worker = worker.replace(oldApiAskParsing, newApiAskParsing);

// Update /api/ask response object to include mcq_questions
worker = worker.replace(
  `suggested_questions: suggestedQuestions,\n      can_continue: finishReason === 'length' || answer.length > 1200`,
  `suggested_questions: suggestedQuestions,\n      mcq_questions: mcqQuestions,\n      can_continue: finishReason === 'length' || answer.length > 1200`
);

fs.writeFileSync('worker/src/index.js', worker, 'utf8');
console.log('worker/src/index.js updated successfully.');

// ==========================================
// 2. UPDATE FRONTEND (index.html)
// ==========================================
let html = fs.readFileSync('index.html', 'utf8');

// Add MCQ CSS styles
const mcqStyles = `
        /* Interactive Multiple-Choice Questions (MCQ) Card */
        .interactive-mcq-card {
            margin: 18px 0 12px 0;
            background: var(--gemini-surface);
            border: 1px solid var(--gemini-border);
            border-radius: 12px;
            padding: 16px 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.18);
            animation: fadeIn 0.3s ease;
        }
        .mcq-card-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 14px;
            font-size: 0.92rem;
            font-weight: 600;
            color: var(--gemini-text-main);
        }
        .mcq-badge {
            background: rgba(26, 115, 232, 0.15);
            color: var(--gemini-blue-light);
            border: 1px solid rgba(26, 115, 232, 0.3);
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .mcq-question-block {
            margin-bottom: 14px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        :root.light-mode .mcq-question-block {
            border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .mcq-question-block:last-child {
            border-bottom: none;
            margin-bottom: 6px;
        }
        .mcq-question-title {
            font-size: 0.88rem;
            font-weight: 600;
            color: var(--gemini-text-main);
            margin-bottom: 8px;
        }
        .mcq-options-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .mcq-option-pill {
            background: var(--gemini-card-bg);
            border: 1px solid var(--gemini-border);
            color: var(--gemini-text-muted);
            padding: 7px 14px;
            border-radius: 20px;
            font-size: 0.82rem;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .mcq-option-pill:hover {
            border-color: var(--gemini-blue-light);
            color: var(--gemini-text-main);
            background: var(--gemini-surface-hover);
        }
        .mcq-option-pill.selected {
            background: var(--gemini-blue) !important;
            border-color: var(--gemini-blue) !important;
            color: #FFFFFF !important;
            font-weight: 600;
            box-shadow: 0 1px 4px rgba(26, 115, 232, 0.4);
        }
        .mcq-actions-bar {
            margin-top: 14px;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 10px;
        }
        .mcq-refine-btn {
            background: var(--gemini-blue);
            color: #FFFFFF;
            border: none;
            padding: 8px 18px;
            border-radius: 20px;
            font-size: 0.84rem;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .mcq-refine-btn:hover {
            background: var(--gemini-blue-hover);
            transform: translateY(-1px);
        }
        .mcq-refine-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
`;

// Insert styles right before /* Response Action Toolbar */
html = html.replace('/* Response Action Toolbar */', mcqStyles + '\n        /* Response Action Toolbar */');

// Update sendMessage function call to pass mcq_questions to appendMessage
html = html.replace(
  `appendMessage(data.answer, 'ai', data.sources, data.suggested_questions, data.can_continue);`,
  `appendMessage(data.answer, 'ai', data.sources, data.suggested_questions, data.can_continue, data.mcq_questions);`
);

// Update appendMessage signature and add MCQ rendering
const oldAppendSig = `function appendMessage(text, role, sources = [], followups = [], canContinue = false) {`;
const newAppendSig = `function appendMessage(text, role, sources = [], followups = [], canContinue = false, mcqs = []) {`;

html = html.replace(oldAppendSig, newAppendSig);

// Insert MCQ rendering inside appendMessage right before Suggested Next Question Chips
const mcqRenderLogic = `
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
`;

html = html.replace('// Suggested Next Question Chips', mcqRenderLogic + '\n                // Suggested Next Question Chips');

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html updated successfully.');
