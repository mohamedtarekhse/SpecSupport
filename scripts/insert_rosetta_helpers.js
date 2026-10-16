const fs = require('fs');
let worker = fs.readFileSync('worker/src/index.js', 'utf8');

const rosettaHelpers = `
// ========================================================================
// 🧬 THE 11 ROSETTA GENOME PILLARS: DETERMINISTIC INTENT & KEYWORD ROUTER
// Replaces free-form hallucinated HyDE with exact engineering retrieval gates
// ========================================================================
function detectTargetPillars(q) {
  const qLower = q.toLowerCase();
  const targetPillars = [];

  // 1. DISCARD_LIMITS (Acceptance / Rejection / Wear / Tolerances)
  if (/wear|limit|discard|rejection|reject|scrap|condemn|allowable|tolerance|maximum allowable|minimum wall|undercut|pit depth|hrc|hardness limit|22 hrc|23 hrc|80%|70%/i.test(qLower)) {
    targetPillars.push('DISCARD_LIMITS');
  }

  // 2. DESIGN_FORMULA (Engineering formulas, wall calculations, hydrotest ratios)
  if (/formula|calculate|equation|maop|smys|barlow|tmin|minimum thickness|wall thickness formula|hoop stress|design pressure|1\\.3|1\\.5|1\\.25|ug-27|304\\.1\\.2/i.test(qLower)) {
    targetPillars.push('DESIGN_FORMULA');
  }

  // 3. TABLE_ANNEX (Tables, schedules, dimensions)
  if (/table|annex|appendix|qw-451|figure|table 1|table 341\\.3\\.2|table 330|table 331/i.test(qLower)) {
    targetPillars.push('TABLE_ANNEX');
  }

  // 4. SCOPE (Demarcation, battery limits, equipment inclusion/exclusion)
  if (/scope|cover|applicable|boundary|out-of-scope|does api|does asme|which standard covers/i.test(qLower)) {
    targetPillars.push('SCOPE');
  }

  // 5. TEST_METHOD / PROCEDURE (NDT technique, dwell, lux, couplant, calibration, PWHT)
  if (/test method|how to inspect|calibration|couplant|pie gauge|lux|intensity|angle beam|dwell time|soak time|preheat|pwht/i.test(qLower)) {
    targetPillars.push('TEST_METHOD', 'PROCEDURE');
  }

  // 6. QUALITY_DOCS (Certificates, MTR, COC, retention, hold points)
  if (/mtr|mill test|coc|certificate|retention|audit|document|hold point|witness point/i.test(qLower)) {
    targetPillars.push('QUALITY_DOCS');
  }

  // 7. PREQUAL_WPS (WPS, PQR, welding variables, filler metals, welder qualifications)
  if (/wps|pqr|welding procedure|prequalified|qw-482|f-no|a-no|p-no|f-number|a-number|p-number|filler metal|electrode|welder qualification|6g|groove/i.test(qLower)) {
    targetPillars.push('PREQUAL_WPS', 'PROCEDURE');
  }

  // 8. SERVICE_CATEGORY (Periodic inspection intervals, Cat I-IV, DS-1 tiers)
  if (/category\\s*(?:i|ii|iii|iv|1|2|3|4|5)|cat\\s*(?:i|ii|iii|iv)|interval|frequency|periodic inspection/i.test(qLower)) {
    targetPillars.push('SERVICE_CATEGORY');
  }

  return Array.from(new Set(targetPillars));
}

function expandRosettaKeywords(question, detectedStd, targetPillars) {
  let expansions = [];

  if (targetPillars.includes('DISCARD_LIMITS')) {
    expansions.push('mandatory acceptance rejection limits discard criteria maximum allowable wear tolerance');
  }
  if (targetPillars.includes('DESIGN_FORMULA')) {
    expansions.push('design formula calculation nominal thickness Barlow MAOP hoop stress');
  }
  if (targetPillars.includes('PREQUAL_WPS')) {
    expansions.push('ASME Section IX Form QW-482 P-Number F-Number A-Number essential variables');
  }
  if (targetPillars.includes('TEST_METHOD')) {
    expansions.push('ASME Section V ASTM examination technique calibration sensitivity lux illumination');
  }
  if (targetPillars.includes('QUALITY_DOCS')) {
    expansions.push('EN 10204 Type 3.1 3.2 MTR Certificate Conformance hold point retention');
  }
  if (detectedStd) {
    expansions.push(detectedStd);
  }

  return expansions.length > 0 ? (question + ' ' + expansions.join(' ')) : question;
}
`;

const targetSig = "async function prepareContextAndMessages(c, question, language, session_id, standard_filter, history = [], mode = 'web', selected_standards = []) {";

if (worker.includes(targetSig)) {
  worker = worker.replace(targetSig, rosettaHelpers + '\n' + targetSig);
  fs.writeFileSync('worker/src/index.js', worker, 'utf8');
  console.log('Successfully inserted Rosetta helper functions!');
} else {
  console.error('Target signature not found.');
}
