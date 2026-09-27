const fs = require('fs');

// 1. UPDATE WORKER
let worker = fs.readFileSync('worker/src/index.js', 'utf8');

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

2. DEFINE THE ENGINEERING GREY AREA BEFORE ASKING:
In welding and NDT inspection, an answer is rarely binary without complete boundary conditions.
NEVER make silent assumptions. If the user prompt omits crucial boundary parameters (such as fluid service, wall thickness, design code, or operating temperature), you MUST explicitly define the "ENGINEERING GREY AREA":
- Explain WHY the standard forks and HOW the decision flips between ACCEPT and REJECT depending on the missing parameter.

MANDATORY GREY AREA FORMAT (when boundary conditions are missing):
### ⚠️ THE ENGINEERING GREY AREA
[State clearly why this decision is in a grey area and cannot be finalized without specific boundary conditions.]
- **Boundary Fork 1 (e.g. Service Severity)**: Explain how acceptance criteria change (e.g. 'Under Normal Fluid Service, up to 1.0 mm (1/32 in.) is acceptable, BUT under Severe Cyclic Conditions, allowable limit is strictly 0.0 mm / REJECT').
- **Boundary Fork 2 (e.g. Wall Thickness Ratio)**: Explain the dimensional formula fork (e.g. 'Allowable depth is min(1.0 mm, tw/4). If wall thickness is < 4 mm, the allowable limit shrinks below 1.0 mm').

### ❓ Clarifying Questions to Resolve the Grey Area:
(Ask a MAXIMUM of 3 precise, targeted questions directly tied to resolving the forks above)
1. [Targeted Question 1]
2. [Targeted Question 2]
3. [Targeted Question 3]

3. MULTI-CODE COMPARISON MATRIX FOR BROAD / AMBIGUOUS QUERIES:
If the user's query is broad or applies across multiple industry sectors (e.g. general questions about "undercut", "porosity", "hydrotest pressure", or "fatigue cracks"), DO NOT assume one code. Provide a **Cross-Sector Comparison Matrix Table** comparing:
- ASME B31.3 (Process Plant Piping)
- API 1104 (Cross-Country Pipelines)
- ASME VIII Div 1 (Pressure Vessels)
- AWS D1.1 (Structural Steel)
- API RP 7G-2 / API 5CT (Drill Stem & Casing if relevant)

4. INTERACTIVE MULTIPLE-CHOICE QUESTIONS (MCQ) TO RESOLVE THE GREY AREA:
Whenever you define a grey area or ask clarifying questions, you MUST ALWAYS append an interactive multiple-choice question block at the very end so the user can click their field parameters:
<!--MCQ: [
  {
    "question": "Nominal Wall Thickness (tw)",
    "options": ["tw ≤ 1/2 in. (12.7 mm)", "1/2 in. < tw ≤ 1 in. (25.4 mm)", "tw > 1 in. Heavy Wall", "Standard Schedule 40"]
  },
  {
    "question": "Fluid Service Condition",
    "options": ["Normal Fluid Service", "Severe Cyclic Conditions", "Category M (Toxic/Lethal)", "Category D (Utility/Water)"]
  },
  {
    "question": "Applicable Design Code",
    "options": ["ASME B31.3 (Process Piping)", "API 1104 (Cross-Country)", "ASME VIII (Pressure Vessel)", "AWS D1.1 (Structural)"]
  }
]-->

5. FORWARD-LOOKING FOLLOW-UP QUESTION CHIPS (DIRECTED AT THE AI):
At the very end of your response, ALWAYS include 4 to 5 forward-looking question chips in exactly this format:
<!--FOLLOWUPS: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]-->
CRITICAL RULES FOR FOLLOW-UP CHIPS:
- NEVER repeat, rephrase, or echo the user's original query.
- NEVER ask the user to answer questions or provide parameters in these chips (that belongs solely in the Grey Area & MCQ section).
- These chips must be FORWARD-LOOKING questions that the USER would click to ask YOU (the AI assistant) subsequent technical details (e.g. repair welding procedures, NDT calibration standards, comparison with ISO standards, inspector certification rules).`;

worker = worker.replace(oldDirectivesRegex, newDirectives);

// Update /api/ask to strictly filter out any suggested questions that repeat user question or ask user for info
const oldFilteringRegex = /if \(suggestedQuestions\.length === 0\) \{[\s\S]*?suggestedQuestions = \[[\s\S]*?\]\s*\}/;

const newFiltering = `    // Strictly filter suggested questions:
    // 1. Must NOT echo the user's question
    // 2. Must NOT ask the user to provide information (that belongs in MCQs)
    const normUserQ = question.trim().toLowerCase();
    suggestedQuestions = suggestedQuestions.filter(sq => {
      if (!sq || typeof sq !== 'string') return false;
      const s = sq.trim().toLowerCase();
      if (s === normUserQ) return false;
      if (s.startsWith('what is your') || s.startsWith('can you provide') || s.startsWith('please specify') || s.startsWith('what are your') || s.startsWith('do you have')) {
        return false;
      }
      return true;
    });

    if (suggestedQuestions.length < 3) {
      // Forward-looking technical inquiries directed at the AI
      suggestedQuestions = [
        "What specific NDT procedure can verify this indication depth?",
        "What is the approved repair procedure if this is rejected?",
        "What are the welder and inspector qualification prerequisites?",
        "How does this criterion compare with ISO or API standards?",
        "What are common false indications observed in field inspection?"
      ];
    }`;

worker = worker.replace(oldFilteringRegex, newFiltering);

fs.writeFileSync('worker/src/index.js', worker, 'utf8');
console.log('Successfully updated worker/src/index.js with Grey Area diagnostics and forward-looking followups.');

// 2. UPDATE FRONTEND (index.html) - add Grey Area highlight styling
let html = fs.readFileSync('index.html', 'utf8');

const greyAreaCss = `
        /* Engineering Grey Area Callout Card */
        .message-body h3:has(+ p, + ul, + ol) {
            margin-top: 20px;
        }
        .grey-area-card {
            background: rgba(245, 158, 11, 0.08);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 8px;
            padding: 12px 16px;
            margin: 14px 0;
        }
`;

if (!html.includes('grey-area-card')) {
  html = html.replace('/* Interactive Multiple-Choice Questions (MCQ) Card */', greyAreaCss + '\n        /* Interactive Multiple-Choice Questions (MCQ) Card */');
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Successfully updated index.html with Grey Area styling.');
}
