const fs = require('fs');
const path = require('path');

const workerPath = path.join(__dirname, '..', 'worker', 'src', 'index.js');
let workerCode = fs.readFileSync(workerPath, 'utf8');

// The block to replace
const oldTriageStart = `  // ==========================================
  // INTERACTIVE PROCEDURE TRIAGE & GLOBAL STANDARD WPS ENGINE
  // ==========================================`;

const oldTriageEnd = `  // Prepend Database Taxonomy & Equipment Governance Directive (Absolute Highest Priority)`;

const startIndex = workerCode.indexOf(oldTriageStart);
const endIndex = workerCode.indexOf(oldTriageEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find existing triage block in worker/src/index.js');
  process.exit(1);
}

const universalProtocolCode = `  // ==========================================
  // 🧬 UNIVERSAL PROGRESSIVE ELICITATION & SENSIBLE DEFAULTS PROTOCOL
  // Covering: Welding, NDT, Hydrotest, In-Service Integrity, Rig Hoisting, Tubulars, Well Control
  // ==========================================
  const qClean = question.toLowerCase();

  // 1. Discipline Detectors
  const isWps = /(?:wps\\b|welding procedure|pqr\\b|welding spec|welding procedure specification)/i.test(qClean);
  const isNdt = /(?:ndt procedure|ut procedure|ultrasonic procedure|rt procedure|radiographic procedure|mpi procedure|magnetic particle procedure|penetrant procedure|dye penetrant procedure|how to inspect (?:weld|tank|pipe|vessel|flange))/i.test(qClean);
  const isHydrotest = /(?:hydrotest procedure|hydrostatic test procedure|pressure test procedure|leak test procedure|pneumatic test procedure|how to hydrotest|hydrostatic test)/i.test(qClean);
  const isIntegrity = /(?:remaining life|retirement thickness|corrosion pit evaluation|api 510 inspection|api 570 inspection|api 653 inspection|fitness for service)/i.test(qClean);
  const isHoisting = /(?:elevator inspection|elevator links wear|drilling hook inspection|swivel inspection|derrick inspection|mast inspection|api rp 8b|api rp 4g)/i.test(qClean);
  const isTubular = /(?:drill pipe inspection|drill stem inspection|tool joint wear|hwdp inspection|drill collar inspection|casing inspection criteria|api rp 7g-2)/i.test(qClean);
  const isBop = /(?:bop test procedure|bop pressure test|blowout preventer test|accumulator drawdown test|choke manifold test|api standard 53)/i.test(qClean);

  if (isWps) {
    const hasBaseMetal = /(?:a106|a333|a53|api 5l|316l?|304l?|p-no|p1|p8|x52|x60|x65|4130|carbon steel|stainless)/i.test(qClean);
    const hasThickness = /(?:sch|schedule|wall|thickness|\\bmm\\b|\\binch\\b|\\bthk\\b|xxs|std)/i.test(qClean);

    if (!hasBaseMetal || !hasThickness) {
      systemPrompt += \`\\n[INTERACTIVE PROCEDURE TRIAGE DIRECTIVE (ASME SECTION IX & B31.3)]:
The user is requesting a welding procedure (WPS) without specifying essential variables.
1. State in 2 clear sentences what a definitive legal WPS requires (citing ASME Section IX Form QW-482 and ASME B31.3 Table 330.1.1 / Table 331.1.1).
2. Provide a practical rule-of-thumb baseline based on global oilfield best practice (e.g. for standard high-pressure carbon steel piping, ASTM A106 Gr B with GTAW root + SMAW fill is standard; PWHT is required only if wall thickness exceeds 19.05 mm / 0.75 in).
3. Conclude by outputting an interactive triage block in this EXACT format:
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
      systemPrompt += \`\\n[DETERMINISTIC ASME FORM QW-482 PROCEDURE DIRECTIVE]:
Generate a complete, audit-ready, field-executable Welding Procedure Specification formatted strictly according to ASME Section IX Form QW-482:
1. HEADER & SCOPE: WPS Number, Revision, Supporting PQR, Process (GTAW root + SMAW fill/cap).
2. JOINTS (QW-402): Single V-Groove, Bevel Angle (60°-75°), Root Face (1.5-2.5 mm), Root Gap (2.0-3.2 mm).
3. BASE METALS (QW-403): Material Specification, P-No & Group No, Qualified Thickness Range per ASME IX QW-451.1.
4. FILLER METALS (QW-404): SFA Spec, AWS Classification (ER70S-6 / E7018-1 H4R), F-No & A-No.
5. POSITION (QW-405): 6G or All Positions, Progression Uphill.
6. PREHEAT (QW-406): ASME B31.3 Table 330.1.1 limits.
7. PWHT (QW-407): ASME B31.3 Table 331.1.1 rules (None if <=19.05mm; 595°C-650°C if >19.05mm).
8. SHIELDING GAS (QW-408): 100% Argon, Flow Rate 10-15 L/min.
9. ELECTRICAL PARAMETERS (QW-409): Table of passes, amps, volts, travel speed, max heat input.
10. NDE & INSPECTION HOLD POINTS: 100% Visual (AWS B1.11 / B31.3) + 100% RT (ASME V Art. 2 / B31.3 Table 341.3.2).
CRITICAL RULE: Apply Global International Standards (ASME/AWS/API). Do NOT impose proprietary operator rules unless requested.\\n\`;
    }
  } else if (isNdt) {
    const hasMethod = /(?:ultrasonic|\but\b|radiograph|\brt\b|magnetic particle|\bmpi\b|\bmt\b|penetrant|\bpt\b|\bdpi\b)/i.test(qClean);
    const hasThkOrGeom = /(?:wall|thickness|\\bmm\\b|\\binch\\b|butt weld|nozzle|fillet|pipe|plate)/i.test(qClean);

    if (!hasMethod || !hasThkOrGeom) {
      systemPrompt += \`\\n[INTERACTIVE NDT PROCEDURE TRIAGE (ASME V & ISO 9712)]:
The user is requesting an NDT procedure without defining the method or component geometry.
1. State in 2 clear sentences what a written NDT procedure requires under ASME Section V (Article 1, T-150) and ISO 9712 (Level II qualification, surface preparation, calibration standard, and acceptance criteria).
2. Provide a practical rule-of-thumb baseline (e.g. for carbon steel butt welds, 100% Visual + Angle Beam UT (or RT) is standard; MT for ferromagnetic surfaces).
3. Output an interactive triage block in this EXACT format:
<!--MCQ: [
  {
    "question": "Target NDT Examination Method",
    "options": ["Angle Beam Ultrasonic Testing (UT/PAUT per Art. 4)", "Radiographic Examination (RT per Art. 2 - Ir-192 / X-ray)", "Magnetic Particle Testing (MT per Art. 7 - Wet / Yoke)", "Liquid Penetrant Testing (PT per Art. 6 - Solvent Removable)"]
  },
  {
    "question": "Component Geometry & Wall Thickness",
    "options": ["Standard Butt Weld (t <= 25 mm / 1 inch)", "Heavy Wall Section (t > 25 mm)", "Nozzle / Structural T-K-Y Joint", "💡 Advise Based on Common Field Spec"]
  },
  {
    "question": "Governing Acceptance Standard",
    "options": ["🌐 Global Standard (ASME B31.3 Table 341.3.2 / ASME VIII Div 1)", "🏢 Specific Company / Client Acceptance Criteria (Provide Spec)"]
  }
]-->\\n\`;
    } else {
      systemPrompt += \`\\n[DETERMINISTIC NDT WRITTEN PROCEDURE DIRECTIVE]:
Generate a complete, field-executable NDT Written Procedure formatted per ASME Section V:
1. SCOPE & APPLICABILITY: Material, thickness range, joint type, governing codes (ASME V + ASME B31.3/ASME VIII).
2. PERSONNEL QUALIFICATION: ASNT SNT-TC-1A / ISO 9712 Level II minimum for testing & evaluation.
3. APPARATUS & CONSUMABLES: Exact equipment model, transducer frequency, couplant, yoke lift capacity (4.5kg AC), light intensity (>= 1076 lux).
4. CALIBRATION PROTOCOL: Calibration block (IIW / DAC curve), verification intervals.
5. STEP-BY-STEP EXAMINATION TECHNIQUE: Surface preparation, scanning patterns, coverage overlap (>= 10%).
6. RECORDING & EVALUATION CRITERIA: Exact thresholds (e.g. 20% & 100% DAC) and acceptance criteria table.
7. REPORTING REQUIREMENTS: Minimum mandatory data on inspection certificate.\\n\`;
    }
  } else if (isHydrotest) {
    const hasPressure = /(?:psi|bar|kpa|class 150|class 300|class 600|design pressure|maop)/i.test(qClean);
    const hasCode = /(?:b31\.3|b31\.4|b31\.8|asme viii|section viii|api 510)/i.test(qClean);

    if (!hasPressure || !hasCode) {
      systemPrompt += \`\\n[INTERACTIVE HYDROTEST PROCEDURE TRIAGE (ASME B31.3 / B31.4 / B31.8)]:
The user is requesting a hydrostatic / leak test procedure without defining the governing code or design pressure.
1. State in 2 clear sentences what a hydrostatic test requires (test ratio, minimum hold duration, dual calibrated gauges, temperature stabilization).
2. Provide a practical rule-of-thumb baseline (e.g. ASME B31.3 process piping requires 1.5x design pressure with 10-minute visual hold; pipelines require 1.25x MAOP with 4-hour hold).
3. Output an interactive triage block in this EXACT format:
<!--MCQ: [
  {
    "question": "Governing Piping / Equipment Code",
    "options": ["Process Piping (ASME B31.3 Para 345 - 1.5x Design)", "Liquid Pipeline (ASME B31.4 Clause 437 - 1.25x MAOP)", "Gas Pipeline (ASME B31.8 Section 841 - 1.25x/1.5x MAOP)", "Pressure Vessel (ASME Section VIII Div 1 UG-99)"]
  },
  {
    "question": "System Rating / Design Pressure",
    "options": ["Class 150 (285 psig / 19.6 bar)", "Class 300 (740 psig / 51.0 bar)", "Class 600 (1480 psig / 102 bar)", "💡 Advise Standard 1.5x Calculation"]
  },
  {
    "question": "Governing Specification Policy",
    "options": ["🌐 Global International Standards (ASME Code Baseline)", "🏢 Custom Company / Client Specification (Provide Spec)"]
  }
]-->\\n\`;
    } else {
      systemPrompt += \`\\n[DETERMINISTIC HYDROSTATIC TEST PROCEDURE DIRECTIVE]:
Generate a complete, audit-ready Hydrostatic Test Procedure and Sequence:
1. TEST PRESSURE FORMULA & CALCULATION: Dual-unit worked calculation showing test pressure ratio and temperature allowance (St/S).
2. TEST MEDIUM & FILLING: Water quality (potable, chlorides < 50 ppm for stainless), high-point venting.
3. PRESSURIZATION SEQUENCE: Staged ramp-up (30%, 60%, 100% test pressure with 10-min hold at each stage).
4. HOLD DURATION & STABILIZATION: Exact time required (e.g. 10 min for piping visual; 4 hr for buried pipeline).
5. INSTRUMENTATION: 2 calibrated gauges (0.5% accuracy, range 1.5x to 4x test pressure) + deadweight tester.
6. ACCEPTANCE & DEPRESSURIZATION: Zero pressure decay; safe controlled depressurization sequence.\\n\`;
    }
  } else if (isIntegrity) {
    const hasGeom = /(?:cylinder|cylindrical|sphere|spherical|head|shell|elbow|pipe|vessel|tank)/i.test(qClean);
    const hasThk = /(?:thickness|\\bmm\\b|\\binch\\b|actual|tmin|corrosion rate)/i.test(qClean);

    if (!hasGeom || !hasThk) {
      systemPrompt += \`\\n[INTERACTIVE FITNESS-FOR-SERVICE TRIAGE (API 510 / 570 / 579)]:
The user is requesting remaining life or thickness evaluation without defining geometry or measured thickness.
1. State in 2 clear sentences how minimum thickness and remaining life are calculated per API 510/570 and ASME VIII UG-27.
2. Provide a practical rule-of-thumb baseline (e.g. cylindrical shell: t = PR/(SE-0.6P); spherical dampener: t = PR/(2SE-0.2P); carbon steel allowable stress S = 20,000 psi).
3. Output an interactive triage block in this EXACT format:
<!--MCQ: [
  {
    "question": "Asset Type & Governing In-Service Code",
    "options": ["Pressure Vessel (API 510 / ASME VIII)", "Process Piping System (API 570 / ASME B31.3)", "Aboveground Storage Tank (API 653 / API 650)"]
  },
  {
    "question": "Shell Component Geometry",
    "options": ["Cylindrical Shell (ASME UG-27(c))", "Spherical Shell / Dampener (ASME UG-27(d))", "2:1 Ellipsoidal Head (ASME 1-4(c))", "💡 Advise Most Common (Cylindrical)"]
  },
  {
    "question": "Governing Standard Policy",
    "options": ["🌐 API Global In-Service Standards Baseline", "🏢 Owner-Operator Asset Integrity Management Spec"]
  }
]-->\\n\`;
    } else {
      systemPrompt += \`\\n[DETERMINISTIC FITNESS-FOR-SERVICE & TMIN EVALUATION DIRECTIVE]:
Execute the complete deterministic engineering calculation:
1. FORMULA & CODE REFERENCE: Cite exact clause (ASME Section VIII UG-27(c)/(d), API 510 Clause 7.1, API 570 Clause 7.1).
2. WORKED MATHEMATICAL CALCULATION: Show formula, plug in numbers, calculate exact t_min in dual units (mm & in).
3. REMAINING LIFE & INSPECTION INTERVAL: Calculate RL = (t_actual - t_min) / CR; Maximum inspection interval = min(10 years, RL / 2).
4. REPAIR / REPLACEMENT DISPOSITION: Clear Pass/Fail verdict.\\n\`;
    }
  } else if (isHoisting) {
    const hasCat = /(?:cat(?:egory)?\s*(?:i{1,3}|iv|1|2|3|4)|overhaul|wear limit)/i.test(qClean);
    const hasEquip = /(?:elevator|links|bail|hook|swivel|block|sheave|mast|derrick)/i.test(qClean);

    if (!hasCat || !hasEquip) {
      systemPrompt += \`\\n[INTERACTIVE HOISTING & STRUCTURAL TRIAGE (API RP 8B / 4G)]:
The user is requesting hoisting or structural inspection guidance without defining equipment type or Category.
1. State in 2 clear sentences what API RP 8B / RP 4G mandates (Categories I through IV, mandatory NDT for critical contact areas, and 5% contact wear limit).
2. Provide a practical rule-of-thumb baseline (Category III is field NDT MPI; Category IV is 5-year full teardown and overhaul; any crack = immediate discard).
3. Output an interactive triage block in this EXACT format:
<!--MCQ: [
  {
    "question": "Hoisting / Structural Equipment Scope",
    "options": ["Drilling Elevators (Center Latch / Slip Type)", "Elevator Links / Bails (Double / Single Hook)", "Crown & Traveling Block Sheaves", "Derrick / Mast Structural Frame (API RP 4G)"]
  },
  {
    "question": "Target Inspection Category",
    "options": ["Category I & II (Daily & Weekly Rig Crew Visual)", "Category III (Field NDT - MPI & Calipers)", "Category IV (5-Year Full Teardown & Overhaul)", "💡 Advise Based on Operating Hours"]
  },
  {
    "question": "Governing Standard Policy",
    "options": ["🌐 API RP 8B / RP 4G International Baseline", "🏢 OEM Procedure (NOV, Varco, Cameron) / Contractor Spec"]
  }
]-->\\n\`;
    } else {
      systemPrompt += \`\\n[DETERMINISTIC API RP 8B / 4G INSPECTION PLAN DIRECTIVE]:
Generate a complete, field-ready Hoisting Equipment Inspection Plan:
1. SCOPE & WEAR LIMITS: 5% original dimension limit in critical contact areas; 10% in non-critical areas.
2. NDT TECHNIQUES: Wet Fluorescent Magnetic Particle (WFMT) per ASTM E709 on 100% of critical load path.
3. CRACK POLICY: Zero tolerance - any crack requires immediate quarantine or OEM remanufacture.
4. PROOF-LOAD & RE-CERTIFICATION: Proof-load test requirements per API Spec 8C PSL 1/2 if structural repair performed.\\n\`;
    }
  } else if (isTubular) {
    const hasClass = /(?:premium|class 2|class 3|ds-1|80%|70%)/i.test(qClean);
    const hasPipe = /(?:drill pipe|tool joint|hwdp|drill collar|casing|tubing)/i.test(qClean);

    if (!hasClass || !hasPipe) {
      systemPrompt += \`\\n[INTERACTIVE DRILL STEM & TUBULAR TRIAGE (API RP 7G-2 & DS-1)]:
The user is requesting drill stem or casing inspection criteria without defining pipe type or classification tier.
1. State in 2 clear sentences what API RP 7G-2 mandates (Premium = 80% min wall, Class 2 = 70% min wall, tool joint OD wear tables).
2. Provide a practical rule-of-thumb baseline (Premium class is standard for directional drilling; fatigue cracks have zero tolerance).
3. Output an interactive triage block in this EXACT format:
<!--MCQ: [
  {
    "question": "Tubular Component Scope",
    "options": ["Drill Pipe Body & Tool Joints", "Heavy Weight Drill Pipe (HWDP)", "Drill Collars & Stabilizers", "API 5CT Casing / Tubing (Wellsite Receiving)"]
  },
  {
    "question": "Target Classification Tier",
    "options": ["Premium Class (Min 80% Remaining Wall)", "Class 2 (Min 70% Remaining Wall - Workover)", "Scrap / Discard Classification (Below 70%/55%)", "💡 Advise Premium Class Baseline"]
  },
  {
    "question": "Governing Specification Policy",
    "options": ["🌐 API RP 7G-2 International Standard Baseline", "🏢 TH Hill DS-1 (Category 3-5 Special Criteria)"]
  }
]-->\\n\`;
    } else {
      systemPrompt += \`\\n[DETERMINISTIC TUBULAR CLASSIFICATION DIRECTIVE]:
Generate the complete API RP 7G-2 tubular classification criteria:
1. REMAINING WALL & OD LIMITS: Exact remaining wall percentages and OD wear formulas.
2. TOOL JOINT INSPECTION: Box & pin shoulder flatness (max 0.002" gap), bevel diameter, thread lead & taper.
3. SLIP & UPSET AREA: Ultrasonic survey of slip crush area; rejection thresholds for slip cuts.
4. MARKING & COLOR BANDING: Paint band color code per API RP 7G-2 Table values (White = Premium, Yellow = Class 2, Red = Scrap).\\n\`;
    }
  } else if (isBop) {
    const hasRwp = /(?:3000|5000|10000|15000|rwp|rated working pressure)/i.test(qClean);
    const hasTest = /(?:low pressure|high pressure|drawdown|routine|initial|operational)/i.test(qClean);

    if (!hasRwp || !hasTest) {
      systemPrompt += \`\\n[INTERACTIVE WELL CONTROL & BOP TRIAGE (API STANDARD 53)]:
The user is requesting BOP test procedures without defining stack pressure rating or test type.
1. State in 2 clear sentences what API Standard 53 requires (mandatory low-pressure 250-350 psi test followed by high-pressure test to RWP, held for 5 minutes).
2. Provide a practical rule-of-thumb baseline (routine tests every 14 days; annular tested to 70% RWP; rams tested to 100% RWP; zero leakage permitted).
3. Output an interactive triage block in this EXACT format:
<!--MCQ: [
  {
    "question": "Well Control Installation Type",
    "options": ["Surface BOP Stack (Land Rig / Jack-up)", "Subsea BOP Stack (Drillship / Semi-submersible)", "Coiled Tubing / Snubbing Unit BOP"]
  },
  {
    "question": "Stack Rated Working Pressure (RWP)",
    "options": ["5,000 psi (34.5 MPa)", "10,000 psi (69.0 MPa)", "15,000 psi (103.4 MPa)", "💡 Advise 10,000 psi Most Common"]
  },
  {
    "question": "Governing Policy",
    "options": ["🌐 API Standard 53 International Baseline", "🏢 Operator Well Control Policy (Provide Spec)"]
  }
]-->\\n\`;
    } else {
      systemPrompt += \`\\n[DETERMINISTIC API STANDARD 53 BOP TEST SEQUENCE DIRECTIVE]:
Generate a complete, step-by-step BOP Pressure Test Sequence:
1. PRE-TEST REQUIREMENTS: Test stump preparation, cup tester / test plug installation, chart recorder calibration.
2. LOW-PRESSURE TEST: 250 - 350 psi held for 5 minutes minimum (zero pressure drop).
3. HIGH-PRESSURE TEST: 100% RWP for pipe rams, blind rams, kill/choke valves; 70% RWP for annular preventer; 5-min hold.
4. ACCUMULATOR DRAWDOWN TEST: API 16D pre-charge and response time limits (rams close in < 30 sec; annular in < 45 sec).
5. DOCUMENTATION: Test chart sign-off by Toolpusher and Company Representative.\\n\`;
    }
  }
`;

const updatedWorker = workerCode.substring(0, startIndex) + universalProtocolCode + workerCode.substring(endIndex);
fs.writeFileSync(workerPath, updatedWorker, 'utf8');
console.log('Successfully updated worker/src/index.js with Universal Progressive Elicitation Protocol!');
