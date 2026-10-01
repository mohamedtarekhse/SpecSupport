const fs = require('fs');
const path = require('path');

// 1. Update worker/src/index.js
const workerPath = path.join(__dirname, '..', 'worker', 'src', 'index.js');
let workerCode = fs.readFileSync(workerPath, 'utf8');

const targetAnchor = `  // Prepend Database Taxonomy & Equipment Governance Directive (Absolute Highest Priority)
  if (taxonomyGovernanceNote) {
    systemPrompt = \`\${taxonomyGovernanceNote}\\n\${systemPrompt}\`
  }`;

const injection = `  // ==========================================
  // INTERACTIVE PROCEDURE TRIAGE & GLOBAL STANDARD WPS ENGINE
  // ==========================================
  const qClean = question.toLowerCase();
  const isProcedureQuery = /(?:wps\\b|welding procedure|pqr\\b|welding spec|welding procedure specification|ndt procedure|hydrotest procedure|pressure test procedure)/i.test(qClean);
  
  if (isProcedureQuery) {
    const hasBaseMetal = /(?:a106|a333|a53|api 5l|316l?|304l?|p-no|p1|p8|x52|x60|x65|4130|carbon steel|stainless)/i.test(qClean);
    const hasThickness = /(?:sch|schedule|wall|thickness|\\bmm\\b|\\binch\\b|\\bthk\\b|xxs|std)/i.test(qClean);

    if (!hasBaseMetal || !hasThickness) {
      // Inspector hasn't defined essential variables yet -> Trigger Claude-Style Interactive Triage
      systemPrompt += \`\\n[INTERACTIVE PROCEDURE TRIAGE DIRECTIVE (ASME SECTION IX & B31.3)]:
The user is requesting a welding or engineering procedure (WPS) but has NOT yet fully defined the critical Essential Variables mandated by ASME Section IX QW-250 and ASME B31.3 Chapter V.
In the field of high-pressure piping and pressure equipment, generating a blind procedure without essential variables violates engineering safety.

YOUR MANDATORY TASK:
1. In the first 2-3 sentences, authoritatively explain what a definitive legal WPS requires (citing ASME Section IX Form QW-482 and ASME B31.3 Table 330.1.1 / Table 331.1.1).
2. Provide a practical rule-of-thumb baseline based on global oilfield best practice (e.g. for standard high-pressure carbon steel piping, ASTM A106 Gr B with GTAW root + SMAW fill is standard; PWHT is required only if wall thickness exceeds 19.05 mm / 0.75 in).
3. Explicitly ask the user to refine their parameters or accept the Global Code Baseline.
4. At the very end of your response, output an interactive triage block in this EXACT format:
<!--MCQ: [
  {
    "question": "Base Metal Specification / Grade",
    "options": ["ASTM A106 Gr B (Carbon Steel - Most Common)", "ASTM A333 Gr 6 (Low Temp -45°C)", "Stainless Steel 316L (Austenitic P-No 8)", "💡 Advise Most Common (A106 Gr B)"]
  },
  {
    "question": "Pipe Wall Thickness / Schedule",
    "options": ["Sch 40 (Standard - No PWHT <=19mm)", "Sch 80 (Heavy Wall - High Integrity)", "Sch 160 / XXS (High Pressure - Mandatory PWHT)", "💡 Advise Based on Standard Pressure"]
  },
  {
    "question": "Service Severity Condition",
    "options": ["Standard Hydrocarbon (ASME B31.3 Normal Service)", "Sour Service H2S (NACE MR0175 / ISO 15156)", "High-Temperature / Severe Cyclic Service"]
  },
  {
    "question": "Governing Specification Policy",
    "options": ["🌐 Global International Standards (ASME B31.3 & ASME IX Baseline)", "🏢 Custom Company / Client Specification (Provide Spec)"]
  }
]-->\\n\`;
    } else {
      // Essential variables provided -> Output Full Deterministic ASME Form QW-482
      systemPrompt += \`\\n[DETERMINISTIC ASME FORM QW-482 PROCEDURE DIRECTIVE]:
The user has provided the critical essential variables or selected the Global Standards baseline.
Generate a complete, audit-ready, field-executable Welding Procedure Specification formatted strictly according to ASME Section IX Form QW-482:
1. HEADER & SCOPE: WPS Number, Revision, Supporting PQR, Welding Process (GTAW root + SMAW fill/cap), Manual technique.
2. JOINTS (QW-402): Single V-Groove, Bevel Angle (60°-75°), Root Face (1.5-2.5 mm / 1/16"-3/32"), Root Gap (2.0-3.2 mm / 3/32"-1/8").
3. BASE METALS (QW-403): Material Specification, P-No & Group No, Qualified Thickness Range per ASME IX QW-451.1.
4. FILLER METALS (QW-404): SFA Spec, AWS Classification (GTAW: ER70S-6 / SMAW: E7018-1 H4R), F-No & A-No, Consumable Insert (None).
5. POSITION (QW-405): Qualified Position (6G or All Positions), Progression (Uphill strictly).
6. PREHEAT (QW-406): Minimum preheat per ASME B31.3 Table 330.1.1, Maximum Interpass Temp (250°C / 482°F).
7. POST-WELD HEAT TREATMENT (PWHT) (QW-407): Strictly apply ASME B31.3 Table 331.1.1. If thickness <= 19.05 mm (0.75"), state 'None Required'. If > 19.05 mm, specify 595°C-650°C holding for 1 hr/inch.
8. SHIELDING GAS (QW-408): 100% Argon (ISO 14175-I1 / AWS A5.32 SG-A), Flow Rate (10-15 L/min or 20-30 CFH), Backing gas if stainless.
9. ELECTRICAL PARAMETERS (QW-409): Table of Passes (Pass, Process, Filler Size, Polarity DCEN/DCEP, Amperage, Voltage, Travel Speed, Max Heat Input kJ/mm).
10. NDE & INSPECTION HOLD POINTS: 100% Visual per AWS B1.11 / ASME B31.3 + 100% RT per ASME V Art. 2 / B31.3 Table 341.3.2.
CRITICAL POLICY RULE: Strictly apply Global International Standards (ASME/AWS/API). NEVER force proprietary operator rules (Aramco/ADNOC) unless explicitly instructed by the user.\\n\`;
    }
  }

  // Prepend Database Taxonomy & Equipment Governance Directive (Absolute Highest Priority)
  if (taxonomyGovernanceNote) {
    systemPrompt = \`\${taxonomyGovernanceNote}\\n\${systemPrompt}\`
  }`;

if (!workerCode.includes('INTERACTIVE PROCEDURE TRIAGE & GLOBAL STANDARD WPS ENGINE')) {
  workerCode = workerCode.replace(targetAnchor, injection);
  fs.writeFileSync(workerPath, workerCode, 'utf8');
  console.log('Successfully injected Interactive Procedure Triage into worker/src/index.js');
} else {
  console.log('Worker already contains Interactive Procedure Triage');
}
