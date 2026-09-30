// scripts/classify_rosetta_genome.js
// Universal Multi-Standard Rosetta Genome Classifier for SpecSupport
// Supports API, ASME, AWS, ISO, ASTM, DS-1/IADC, AISC, SOP

function detectOrganization(stdCode, content) {
  const s = (stdCode || '').toLowerCase();
  const c = (content || '').toLowerCase();
  if (s.includes('asme') || s.includes('b31.') || s.includes('bpvc')) return 'ASME';
  if (s.includes('aws') || s.includes('b1.11') || s.includes('d1.1')) return 'AWS';
  if (s.includes('ds1') || s.includes('ds-1') || s.includes('iadc')) return 'DS-1 / IADC';
  if (s.includes('astm')) return 'ASTM';
  if (s.includes('iso') || s.includes('nace')) return 'ISO';
  if (s.includes('asnt') || s.includes('snt-tc-1a')) return 'ASNT';
  if (s.includes('api') || s.includes('1104')) return 'API';
  if (s.includes('aisi') || s.includes('aisc')) return 'AISC';
  if (s.includes('sop')) return 'SOP';
  
  if (c.includes('american petroleum institute') || c.includes('api rp') || c.includes('api spec')) return 'API';
  if (c.includes('american society of mechanical engineers') || c.includes('asme boiler')) return 'ASME';
  if (c.includes('american welding society')) return 'AWS';
  if (c.includes('drilling manual') || c.includes('iadc')) return 'DS-1 / IADC';
  return 'INTERNATIONAL';
}

function resolveRosettaBridge(org, stdCode, content) {
  const c = (content || '').toLowerCase();
  const bridges = [];

  if (org === 'API') {
    bridges.push('ASTM E709 / E165 (NDT Method)');
    bridges.push('ASME IX / AWS D1.1 (Welding Qual)');
    bridges.push('ISO 9712 / ASNT SNT-TC-1A (Personnel)');
    if (c.includes('pipe') || c.includes('casing') || c.includes('tubing')) {
      bridges.push('API Spec 5CT / 5L');
    }
    if (c.includes('mast') || c.includes('derrick') || c.includes('substructure')) {
      bridges.push('API Spec 4F / API RP 4G / AWS D1.1');
    }
    if (c.includes('elevator') || c.includes('hoisting') || c.includes('swivel')) {
      bridges.push('API Spec 8C / API RP 8B');
    }
  } else if (org === 'ASME') {
    bridges.push('ASME Section V (NDT Exam)');
    bridges.push('ASME Section IX (WPS/Welder Qual)');
    bridges.push('API 510 / API 570 (In-Service Inspection)');
    bridges.push('EN 10204 (3.1 MTR)');
    if (c.includes('b31.3') || c.includes('piping')) {
      bridges.push('ASME B31.3 / B16.5 (Flanges)');
    }
    if (c.includes('vessel') || c.includes('uw-51') || c.includes('ug-27')) {
      bridges.push('ASME Section VIII Div 1 (U-Stamp)');
    }
  } else if (org === 'AWS') {
    bridges.push('AWS B1.11 (Visual Inspection Guide)');
    bridges.push('ASME Section IX (Welder Performance)');
    bridges.push('API Spec 4F / AISC 360 (Structural Steel)');
    bridges.push('ASTM E709 / ASME V (NDT Flaw Sizing)');
  } else if (org === 'ISO') {
    bridges.push('ISO 9712 (NDT Personnel Level II)');
    bridges.push('ISO 3834-2 (Comprehensive Quality)');
    bridges.push('ISO 9606-1 (Welder Approval)');
    bridges.push('ISO 15156 / NACE MR0175 (Sour Service)');
  } else if (org === 'ASTM') {
    bridges.push('API Spec / ASME VIII (Governing Acceptance Criteria)');
    bridges.push('ASNT SNT-TC-1A (Technician Qualification)');
    bridges.push('Apparatus Calibration (Castrol Strip / Gauss Meter / Lux Meter)');
  } else if (org === 'DS-1 / IADC') {
    bridges.push('API RP 7G-2 (Used Drill Stem Elements)');
    bridges.push('API Spec 5DP / API Spec 7-1 (Tool Joints)');
    bridges.push('ASTM E709 (Wet Fluorescent MPI)');
    bridges.push('EMI / UT Wall Survey (80% Premium / 70% Class 2)');
  } else if (org === 'AISC') {
    bridges.push('AWS D1.1 (Structural Welding)');
    bridges.push('ASTM A36 / A572 / A992 (Structural Steel)');
    bridges.push('API Spec 4F (Derrick Design Stress)');
  }

  return Array.from(new Set(bridges)).join(' | ');
}

function classifyChunkUniversal(chunk) {
  const content = (chunk.content || '').toLowerCase();
  const clause = (chunk.clause || '').toLowerCase();
  const section = (chunk.section || '').toLowerCase();
  const stdCode = chunk.standard_code || '';

  const org = detectOrganization(stdCode, content);
  const rosetta = resolveRosettaBridge(org, stdCode, content);

  // 1. Detect TOC or Publisher Noise
  const dotMatches = content.match(/(?:\.\s*){3,}\s*\d+/g) || [];
  const isPublisherNoise = /black plate|all rights reserved|printed in usa|supersedes|american institute of steel/i.test(content) && content.length < 500;
  const isToc = dotMatches.length >= 2 || (content.includes('table of contents') && dotMatches.length >= 1) || (clause.includes('prelim') || section.includes('prelim'));

  if (isToc || isPublisherNoise) {
    return {
      organization: org,
      pillar_type: 'TOC_NOISE',
      is_excluded: 1,
      in_scope: null,
      out_of_scope: null,
      acceptance_limits: null,
      rejection_limits: null,
      normative_refs: null,
      qa_docs: null
    };
  }

  // 2. Detect Engineering Design Formulas (ASME UG-27, 304.1.2, Barlow, MAOP)
  const isDesignFormula = /ug-27|304\.1\.2|clause 401|para 841|t\s*=\s*(?:pr|pd)|p\s*=\s*2st\/d|maop|smys|hoop stress|joint efficiency\s*[eE]\b/i.test(content) || /formula|equation|wall thickness calculation/i.test(clause);
  if (isDesignFormula) {
    return {
      organization: org,
      pillar_type: 'DESIGN_FORMULA',
      is_excluded: 0,
      in_scope: null,
      out_of_scope: null,
      acceptance_limits: 'Design limit calculated per formula: t = PR/(2SE - 0.2P) or Barlow P = 2St/D',
      rejection_limits: 'Thickness below calculated code minimum mandates derating or immediate replacement',
      normative_refs: rosetta,
      qa_docs: 'Design Calculation Sheet verified by Registered PE / AI'
    };
  }

  // 3. Detect Empirical NDT Test Method (ASTM E709, E165, E114, E94, Pie Gauge, Light intensity)
  const isTestMethod = org === 'ASTM' || /astm e|test method|apparatus|magnetic field indicator|pie gauge|castrol strip|gauss meter|blacklight intensity|1000\s*(?:µw|uw)\/cm|1076\s*lux|100\s*fc|dwell time/i.test(content) || /examination technique|transducer frequency/i.test(clause);
  if (isTestMethod && !/acceptance criteria|rejection/i.test(content)) {
    return {
      organization: org,
      pillar_type: 'TEST_METHOD',
      is_excluded: 0,
      in_scope: 'Physical examination & calibration protocol',
      out_of_scope: 'Acceptance thresholds deferred to product specification',
      acceptance_limits: 'Proper field strength verified via Pie Gauge (min 3 lines visible) & Light >= 1076 lux',
      rejection_limits: 'Examination invalid if light < 1076 lux or field intensity inadequate',
      normative_refs: rosetta,
      qa_docs: 'Equipment Calibration Certificate (annual) & Daily verification log'
    };
  }

  // 4. Detect Service Categories (DS-1 Categories 1-5, API Categories I-IV)
  const isServiceCategory = /category\s*[1-5]\b|category\s*(?:i|ii|iii|iv)\b|cat\s*(?:i|ii|iii|iv)\b/i.test(content) && /inspection\s*(?:method|frequency|interval|table)/i.test(content);
  if (isServiceCategory) {
    return {
      organization: org,
      pillar_type: 'SERVICE_CATEGORY',
      is_excluded: 0,
      in_scope: 'Categorical service tier & inspection frequency assignment',
      out_of_scope: null,
      acceptance_limits: 'Compliance with specified category inspection interval (Daily, Weekly, 6-Mo, 2-Yr, 5-Yr, 10-Yr)',
      rejection_limits: 'Overdue periodic category overhaul halts operation until certified',
      normative_refs: rosetta,
      qa_docs: 'Equipment Inspection Logbook & Category Tagging'
    };
  }

  // 5. Detect Prequalified WPS (AWS D1.1 Clause 3)
  const isPrequalWPS = org === 'AWS' && (/clause 3|prequalified|prequalification|preheat table|b-u2a|tc-u4a|c-u2a/i.test(content) || /prequal/i.test(clause));
  if (isPrequalWPS) {
    return {
      organization: org,
      pillar_type: 'PREQUAL_WPS',
      is_excluded: 0,
      in_scope: 'Prequalified welding joint details exempt from qualification testing',
      out_of_scope: 'Non-standard joints require formal PQR qualification testing',
      acceptance_limits: 'Joint dimensions, root opening, and bevel angle conforming to AWS D1.1 figures',
      rejection_limits: 'Deviations exceeding fabrication tolerances mandate PQR testing',
      normative_refs: rosetta,
      qa_docs: 'Written Prequalified WPS Document'
    };
  }

  // 6. Detect Discard, Wear & Acceptance Limits (Sections 7-8, UW-51/52, AWS Table 6.1, DS-1 Wear)
  const hasAcceptance = /acceptance criteria|acceptance:|acceptance limits|pass criteria|allowable indication|uw-51|uw-52|table 6\.1|table 6\.2|قبول/i.test(content);
  const hasRejection = /rejection criteria|rejection:|reject:|discard criteria|wear limit|undertolerance|maximum allowable|minimum wall|crack.*reject|class 2|class 3|scrap|condemn|رفض/i.test(content);
  
  if (hasAcceptance || hasRejection || clause.includes('discard') || clause.includes('wear') || clause.includes('tolerance') || section.includes('discard') || section.includes('wear') || /uw-51|uw-52|table 6\.1/i.test(content)) {
    let lines = chunk.content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let acc = lines.find(l => /ACCEPTANCE|Acceptance:|Acceptance Criteria|allowable|قبول/i.test(l)) || null;
    let rej = lines.find(l => /REJECTION|Reject:|Rejection Criteria|Discard|scrap|condemn|رفض/i.test(l)) || null;

    if (!acc && hasAcceptance) {
      if (org === 'ASME') acc = 'ASME UW-51/52: Cracks, lack of fusion/penetration prohibited; elongated indication <= 6mm (t <= 19mm)';
      else if (org === 'AWS') acc = 'AWS Table 6.1: Visual undercut <= 1/32 in. (1 mm); zero cracks; zero porosity >= 5/32 in.';
      else if (org === 'DS-1 / IADC') acc = 'DS-1 Premium: Remaining wall >= 80% nominal; Tool Joint bevel wear within tolerance';
      else acc = 'Acceptable within specified tolerance envelope per clause';
    }
    if (!rej && hasRejection) {
      if (org === 'ASME') rej = 'Any linear crack, lack of fusion, or elongation exceeding UW-51 limits is unconditionally rejected';
      else if (org === 'AWS') rej = 'Any crack, lack of fusion, or undercut exceeding 1/32 in. requires backgouging and repair';
      else if (org === 'DS-1 / IADC') rej = 'Remaining wall < 70% (Class 3/Scrap) or fatigue cracks mandates immediate condemnation';
      else rej = 'Exceeding wear limit or presence of crack mandates component discard/quarantine';
    }

    return {
      organization: org,
      pillar_type: 'DISCARD_LIMITS',
      is_excluded: 0,
      in_scope: null,
      out_of_scope: null,
      acceptance_limits: acc ? acc.slice(0, 220) : null,
      rejection_limits: rej ? rej.slice(0, 220) : null,
      normative_refs: rosetta,
      qa_docs: null
    };
  }

  // 7. Detect Scope & Demarcation (Clause 1)
  if (clause.includes('scope') || section.includes('scope') || content.includes('this specification covers') || content.includes('this recommended practice covers') || content.includes('this standard specifies') || content.includes('equipment covered') || clause.includes('1.1') || clause.includes('1.2')) {
    let inScope = null;
    let outScope = null;
    if (content.includes('covers') || content.includes('applicable to') || content.includes('specifies')) {
      inScope = chunk.content.slice(0, 200).replace(/\n/g, ' ').trim();
    }
    if (content.includes('not cover') || content.includes('excluded') || content.includes('does not apply')) {
      outScope = 'Excluded auxiliary items and battery limit boundaries noted in clause';
    }
    return {
      organization: org,
      pillar_type: 'SCOPE',
      is_excluded: 0,
      in_scope: inScope,
      out_of_scope: outScope,
      acceptance_limits: null,
      rejection_limits: null,
      normative_refs: rosetta,
      qa_docs: null
    };
  }

  // 8. Detect Normative References & NDT (Clause 2)
  if (clause.includes('normative') || section.includes('normative') || clause.includes('reference') || section.includes('reference') || /astm e|asme section v|aws d1\.1|iso 9712|snt-tc-1a|api rp 2x/i.test(content)) {
    return {
      organization: org,
      pillar_type: 'NORMATIVE_REF',
      is_excluded: 0,
      in_scope: null,
      out_of_scope: null,
      acceptance_limits: null,
      rejection_limits: null,
      normative_refs: rosetta,
      qa_docs: null
    };
  }

  // 9. Detect Quality, Documentation, Mill Certificates & Hold Points
  if (/quality|documentation|mill test report|\bmtr\b|certificate of conformance|\bcoc\b|record retention|traceability|marking|stencil|serial number|inspection certificate|u-1 form|nameplate stamping|hold point/i.test(content)) {
    let docs = [];
    if (/mtr|mill test/i.test(content)) docs.push('MTR (EN 10204 3.1/3.2)');
    if (/coc|conformance/i.test(content)) docs.push('Certificate of Conformance (COC)');
    if (/ndt|inspection report/i.test(content)) docs.push('NDT Inspection Report (Level II)');
    if (/u-1|stamping|nameplate/i.test(content)) docs.push('ASME Form U-1 / Code Stamping');
    if (/hold point/i.test(content)) docs.push('Mandatory Hold Point (H) Sign-off');
    if (/retention|retain/i.test(content)) docs.push('5-Yr / Asset Lifetime Statutory Retention');

    return {
      organization: org,
      pillar_type: 'QUALITY_DOCS',
      is_excluded: 0,
      in_scope: null,
      out_of_scope: null,
      acceptance_limits: null,
      rejection_limits: null,
      normative_refs: rosetta,
      qa_docs: docs.join(', ') || 'QA Audit Documentation Matrix'
    };
  }

  // 10. Detect Table / Annex / Schedules
  if (/^table\s*\d+/i.test(clause) || /^table\s*\d+/i.test(section) || /^annex\s*[a-z]/i.test(clause) || /^appendix/i.test(section)) {
    return {
      organization: org,
      pillar_type: 'TABLE_ANNEX',
      is_excluded: 0,
      in_scope: null,
      out_of_scope: null,
      acceptance_limits: null,
      rejection_limits: null,
      normative_refs: rosetta,
      qa_docs: null
    };
  }

  // 11. Detect Inspection, Maintenance & PWHT Procedure
  if (/overhaul|disassembly|assembly|inspection procedure|running practice|preheat|pwht|soak time|calibration procedure/i.test(content) || /procedure|maintenance/i.test(clause)) {
    return {
      organization: org,
      pillar_type: 'PROCEDURE',
      is_excluded: 0,
      in_scope: null,
      out_of_scope: null,
      acceptance_limits: null,
      rejection_limits: null,
      normative_refs: rosetta,
      qa_docs: null
    };
  }

  return {
    organization: org,
    pillar_type: 'GENERAL',
    is_excluded: 0,
    in_scope: null,
    out_of_scope: null,
    acceptance_limits: null,
    rejection_limits: null,
    normative_refs: rosetta,
    qa_docs: null
  };
}

module.exports = {
  detectOrganization,
  resolveRosettaBridge,
  classifyChunkUniversal
};
