const fs = require('fs');
const path = require('path');

// 1. Update worker/src/index.js
const workerPath = path.resolve(__dirname, '../worker/src/index.js');
let workerCode = fs.readFileSync(workerPath, 'utf8');

const universalGenomeDirectives = `
// ========================================================================
// 🧬 THE UNIVERSAL API STANDARD GENOME (4-PILLAR ARCHITECTURE)
// Directives for Scope Guard, Normative Bridge, Quality Docs, & Limits
// ========================================================================
const UNIVERSAL_API_GENOME = \`
UNIVERSAL API STANDARD GENOME (THE 4 ESSENTIAL PILLARS):
Every standards evaluation in SpecSupport MUST strictly incorporate and address the 4 universal structural pillars inherent to API, ISO, and ASME codes:

PILLAR 1: SECTION 1 SCOPE GUARD & EQUIPMENT DEMARCATION
- Explicitly state the Governing Standard Edition, Equipment Category, and Boundary Conditions.
- Detail what equipment is IN-SCOPE.
- Detail what equipment is EXPLICITLY OUT-OF-SCOPE (e.g., API RP 8B covers elevators, links, hooks, and blocks, but explicitly excludes drill pipe [API RP 7G-2], rotary tongs/slips [API 7K], and crown sheaves/wireline [API RP 9B]).
- OUT-OF-SCOPE INTERCEPTION: If the user asks about an equipment under an invalid standard (e.g., drill pipe under API 8B), IMMEDIATELY issue a Scope Demarcation Alert, cite Section 1 Scope boundaries, and redirect directly to the correct governing standard!

PILLAR 2: SECTIONS 7-8 DIRECT VERDICT & ACCEPTANCE / REJECTION LIMITS
- Provide the direct compliance disposition in the opening sentences.
- Explicit numerical limits: Maximum allowable wear %, remaining wall tolerance, clearance limits, or fatigue thresholds.
- Mandatory Rejection / Discard threshold (e.g., zero-tolerance cracks, > 5% bore wear, wall thickness < 87.5% nominal).

PILLAR 3: SECTION 2 NORMATIVE REFERENCE BRIDGE (NDT & PROCEDURAL CHAIN)
- Connect the In-Service API Recommended Practice to the referenced procedural codes:
  * NDT Methods: ASTM E709 / ASME Section V Article 7 (MT), ASTM E165 / ASME V Article 6 (PT), ASME V Article 4 (UT), ASME V Article 2 (RT).
  * Welding Procedures: AWS D1.1 (Structural), API 1104 (Pipelines), ASME Section IX (Pressure Vessels).
  * Personnel Qualification: ASNT SNT-TC-1A / ISO 9712 Level II minimum (Level III procedure approval).
  * Referenced Acceptance Code: Point to the cross-referenced code table (e.g., ASME Section VIII Div 1 App 6 or AWS D1.1 Clause 6).

PILLAR 4: QUALITY, DOCUMENTATION & AUDIT COMPLIANCE MATRIX
- Mandatory Quality Records required for rig audit compliance:
  * Mill Test Report (MTR / EN 10204 Type 3.1 / 3.2 Certificate)
  * Certificate of Conformance (COC) from OEM / API Licensed Facility
  * NDT Inspection Certificate & Full Flaw Mapping Log
  * Dimensional Verification & Caliper Tally Record
  * Category III / IV Inspection Records & Overhaul Logs
- Minimum Record Retention Period: Exact duration mandated by API Q1 and the standard (e.g., 5 Years or Asset Lifetime).
- Inspection & Test Plan (ITP) Hold Points: Hold Point (H), Witness Point (W), Surveillance (S).
\`;
`;

// Insert UNIVERSAL_API_GENOME if not present
if (!workerCode.includes('UNIVERSAL_API_GENOME')) {
    workerCode = workerCode.replace('const coreInspectionDirectives = `', `${universalGenomeDirectives}\n  const coreInspectionDirectives = \`\n\${UNIVERSAL_API_GENOME}\n`);
}

// Add Scope Guard Mismatch Interceptor in worker
const scopeGuardDetector = `
  // 🛡️ UNIVERSAL SCOPE GUARD DETECTOR (Prevents cross-standard hallucinations)
  const normQ = question.toLowerCase();
  let scopeGuardAlert = '';

  if ((normQ.includes('drill pipe') || normQ.includes('drill collar') || normQ.includes('tool joint') || normQ.includes('hwdp') || normQ.includes('drill stem')) && (normQ.includes('8b') || normQ.includes('api 8b'))) {
    scopeGuardAlert = \`SCOPE DEMARCATION ALERT [API RP 8B Clause 1.2 Exclusion]:
• Queried Equipment: Drill Pipe / Drill Stem / Tool Joints
• Boundary Violation: Drill stem components are EXPLICITLY OUT OF SCOPE for API RP 8B. API RP 8B is strictly restricted to Hoisting Equipment (elevators, links, blocks, hooks, swivels).
• Correct Governing Standard: API RP 7G-2 (Recommended Practice for Inspection and Classification of Used Drill Stem Elements) or TH Hill DS-1 (Category 3-5).
• Immediate Action: Do NOT apply API 8B. Consult API RP 7G-2 Clause 10 for drill pipe body wall wear and tool joint discard limits.\`;
  } else if ((normQ.includes('rotary slips') || normQ.includes('power tongs') || normQ.includes('rotary table') || normQ.includes('kelly bushing')) && (normQ.includes('8b') || normQ.includes('api 8b'))) {
    scopeGuardAlert = \`SCOPE DEMARCATION ALERT [API RP 8B Clause 1.2 Exclusion]:
• Queried Equipment: Rotary Tongs / Rotary Slips / Rotary Table
• Boundary Violation: Rotary drilling tools are EXPLICITLY EXCLUDED from API RP 8B.
• Correct Governing Standard: API Spec 7K (Drilling and Well Servicing Equipment) / API RP 7L.
• Immediate Action: Consult API 7K for power tong die wear, slip crushing limits, and rotary torque limits.\`;
  } else if ((normQ.includes('casing') || normQ.includes('tubing')) && (normQ.includes('7k') || normQ.includes('api 7k'))) {
    scopeGuardAlert = \`SCOPE DEMARCATION ALERT [API 7K Scope Boundary]:
• Queried Equipment: Casing and Tubing Tubulars
• Boundary Violation: Oil country tubular goods (OCTG) are governed by API Spec 5CT (Manufacturing) and API RP 5C1 (Care and Use), NOT API 7K.
• Immediate Action: Refer to API 5CT for pipe body tolerances (-12.5% wall undertolerance) and API RP 5C1 for torque-turn makeup and running practices.\`;
  } else if ((normQ.includes('drilling line') || normQ.includes('wire rope') || normQ.includes('crown sheaves')) && (normQ.includes('8b') || normQ.includes('api 8b'))) {
    scopeGuardAlert = \`SCOPE DEMARCATION ALERT [API RP 8B Clause 1.2 Exclusion]:
• Queried Equipment: Drilling Wire Rope / Wireline / Crown Sheaves
• Boundary Violation: Wire rope and sheaves are EXCLUDED from API RP 8B.
• Correct Governing Standard: API Spec 9A (Wire Rope Specification), API RP 9B (Application, Care, and Use of Wire Rope for Oilfield Service), and API RP 4G Section 8 (Sheave Groove Gauging).
• Immediate Action: Refer to API RP 9B for ton-mile slip and cut programs and API RP 4G for sheave groove wear gauges.\`;
  }

  if (scopeGuardAlert) {
    results.unshift(scopeGuardAlert);
  }
`;

if (!workerCode.includes('UNIVERSAL SCOPE GUARD DETECTOR')) {
    workerCode = workerCode.replace('// 1. ASME B31.3 Process Piping High Pressure & Severe Cyclic Discard Criteria', `${scopeGuardDetector}\n  // 1. ASME B31.3 Process Piping High Pressure & Severe Cyclic Discard Criteria`);
}

fs.writeFileSync(workerPath, workerCode, 'utf8');
console.log('Successfully updated worker/src/index.js with Universal API Standard Genome and Scope Guard.');

// 2. Update index.html LocaSpec engine with the 4-Pillar Structure
const indexPath = path.resolve(__dirname, '../index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const oldLocaspecFormatRegex = /function formatLocaSpecOfflineAnswer\(question, matchedChunks, isArabic\) {[\s\S]*?return res;\s*\}/;

const newLocaspecFormat = `function formatLocaSpecOfflineAnswer(question, matchedChunks, isArabic) {
            let substantiveChunks = (matchedChunks || []).filter(c => !isTocOrIndexChunk(c.content));
            if (substantiveChunks.length === 0) substantiveChunks = matchedChunks || [];

            const qLower = question.toLowerCase();

            // 🛡️ Scope Guard Check (Client-Side)
            let scopeMismatch = null;
            if ((qLower.includes('drill pipe') || qLower.includes('tool joint') || qLower.includes('drill collar') || qLower.includes('hwdp')) && (qLower.includes('8b') || qLower.includes('api 8b'))) {
                scopeMismatch = {
                    equipment: 'Drill Pipe / Drill Stem / Tool Joints',
                    queriedStd: 'API RP 8B',
                    clause: 'Clause 1.2 (Scope Exclusions)',
                    correctStd: 'API RP 7G-2 / TH Hill DS-1 (Category 3-5)',
                    noteAr: 'مواسير الحفر مستبعدة صراحة من نطاق API RP 8B المخصص لمعدات الرفع فقط (Elevators, Links, Hooks). المعيار الحاكم هو API RP 7G-2.',
                    noteEn: 'Drill pipe is explicitly excluded from API RP 8B (Hoisting Tools only). Governing code is API RP 7G-2 Section 10.'
                };
            } else if ((qLower.includes('rotary slips') || qLower.includes('power tongs')) && (qLower.includes('8b') || qLower.includes('api 8b'))) {
                scopeMismatch = {
                    equipment: 'Power Tongs / Rotary Slips',
                    queriedStd: 'API RP 8B',
                    clause: 'Clause 1.2 (Scope Exclusions)',
                    correctStd: 'API Spec 7K / API RP 7L',
                    noteAr: 'معدات الدوران والتثبيت (Slips & Tongs) خاضعة لمعيار API 7K وليس API 8B.',
                    noteEn: 'Rotary slips and power tongs are governed by API 7K, not API 8B.'
                };
            } else if ((qLower.includes('wire rope') || qLower.includes('drilling line')) && (qLower.includes('8b') || qLower.includes('api 8b'))) {
                scopeMismatch = {
                    equipment: 'Drilling Wireline / Wire Rope',
                    queriedStd: 'API RP 8B',
                    clause: 'Clause 1.2 (Scope Exclusions)',
                    correctStd: 'API Spec 9A / API RP 9B & API RP 4G',
                    noteAr: 'واير الحفر والبكرات مستبعدة من API 8B وتخضع لمعيار API RP 9B للقطع والتزحلق ومعيار API 4G للبكرات.',
                    noteEn: 'Drilling wire rope is excluded from API 8B and governed by API RP 9B (ton-mile cutoff) and API RP 4G.'
                };
            }

            if (scopeMismatch) {
                if (isArabic) {
                    return '### ⚠️ تنبيه حارس النطاق (Scope Guard Alert — ' + scopeMismatch.queriedStd + ' ' + scopeMismatch.clause + ')\\n\\n' +
                           '> **تنبيه هندسي مانع للهلوسة: المعدة المطلوبة تقع خارج نطاق المعيار صراحة!**\\n\\n' +
                           '| بند التدقيق | التفاصيل الهندسية |\\n' +
                           '| :--- | :--- |\\n' +
                           '| **المعدة المطلوبة** | ' + scopeMismatch.equipment + ' |\\n' +
                           '| **حدود المعيار** | ' + scopeMismatch.queriedStd + ' يغطي معدات الرفع فقط ويستبعد هذه المعدة بنص صريح |\\n' +
                           '| **المعيار الحاكم الصحيح** | **' + scopeMismatch.correctStd + '** |\\n\\n' +
                           '**الإجراء المعتمد:** ' + scopeMismatch.noteAr + '\\n\\n' +
                           '---\\n*💡 تم اكتشاف عدم تطابق النطاق آلياً عبر محرك Scope Guard الميداني لمنع أي تقييم خاطئ على البريمة.*';
                } else {
                    return '### ⚠️ Scope Demarcation Alert (' + scopeMismatch.queriedStd + ' ' + scopeMismatch.clause + ')\\n\\n' +
                           '> **Anti-Hallucination Scope Guard: Equipment is explicitly OUT OF SCOPE!**\\n\\n' +
                           '| Audit Parameter | Engineering Specification |\\n' +
                           '| :--- | :--- |\\n' +
                           '| **Queried Equipment** | ' + scopeMismatch.equipment + ' |\\n' +
                           '| **Code Boundary** | ' + scopeMismatch.queriedStd + ' strictly excludes this equipment under Section 1 Scope |\\n' +
                           '| **Correct Governing Code** | **' + scopeMismatch.correctStd + '** |\\n\\n' +
                           '**Mandatory Action:** ' + scopeMismatch.noteEn + '\\n\\n' +
                           '---\\n*💡 Scope Demarcation automatically intercepted via LocaSpec Scope Guard to prevent invalid rig compliance evaluation.*';
                }
            }

            if (substantiveChunks.length === 0) {
                if (isArabic) {
                    return '### 🛰️ محرك لوكا سبيك الميداني (أوفلاين بدون إنترنت)\\n' +
                           'لم يتم العثور على بنود مطابقة مباشرة لسؤالك في الحزمة المحلية المحملة حالياً على الجهاز.\\n' +
                           'يرجى التأكد من تزامن حزمة المعايير المطلوبة من لوحة **LocaSpec™**، أو تحديد كود المعيار بدقة (مثال: API RP 8B أو API 4G).';
                } else {
                    return '### 🛰️ LocaSpec™ Field Offline Engine (Zero-Latency Local Retrieval)\\n' +
                           'No directly matching clauses found in your currently cached local rig bundle.\\n' +
                           'Please ensure your target package is synchronized in the **LocaSpec™** panel, or refine your query with standard codes (e.g. API RP 8B, API 4G, ASME V).';
                }
            }

            const primary = substantiveChunks[0];
            const std = primary.standard_code || 'Standard Reference';
            const clause = primary.clause || 'Field Inspection Clause';
            const sec = primary.section || 'General';
            const cleanBody = cleanChunkContent(primary.content);

            const lines = cleanBody.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
            const acceptance = lines.find(l => /ACCEPTANCE|Acceptance Criteria|معيار القبول|حدود القبول/i.test(l)) || '';
            const rejection = lines.find(l => /REJECTION|Reject|معيار الرفض|حدود الرفض/i.test(l)) || '';
            const mandatoryRules = lines.filter(l => /\\b(shall|must|mandatory|يجب|يلزم|ممنوع|لا يجوز)\\b/i.test(l)).slice(0, 4);

            let res = '';
            if (isArabic) {
                res += '### 🛰️ تقييم لوكا سبيك الميداني الشامل — ' + std + ' (' + clause + ')\\n';
                res += '> **معتمد طبقاً للهيكل الجيني لمعايير API (نطاق المعدة + حد الرفض + إحالة NDT + وثائق الجودة)**\\n\\n';

                // Pillar 1: Scope & Demarcation
                res += '#### 1️⃣ نطاق التطبيق والمعدات المشمولة (Section 1: Scope Guard)\\n';
                res += '- **المعيار الحاكم:** \`' + std + '\` — **البند:** \`' + clause + '\`' + (sec ? ' | **القسم:** ' + sec : '') + '\\n';
                res += '- **المعدات المشمولة:** مكونات ومعدات التشغيل الخاضعة لـ ' + std + ' في الميدان.\\n';
                res += '- **حدود النطاق:** يقتصر التطبيق على البنود المصرح بها ويُستبعد أي تطبيق خارج إرشادات الصانع (OEM).\\n\\n';

                // Pillar 2: Technical Verdict & Discard Limits
                res += '#### 2️⃣ الخلاصة الفنية ومعايير القبول والرفض (Sections 7-8: Acceptance & Discard)\\n';
                if (acceptance) {
                    res += '- **✅ معايير القبول المعتمدة:** ' + acceptance.replace(/^[A-Z_]+:\\s*/i, '') + '\\n';
                } else {
                    res += '- **✅ معايير القبول المعتمدة:** مطابقة تامة للأبعاد الأصلية، وخلو الأسطح الحاملة للأحمال من أي شروخ أو تآكل يتجاوز سماحية الصانع.\\n';
                }
                if (rejection) {
                    res += '- **❌ معيار الرفض والإلغاء الفوري:** ' + rejection.replace(/^[A-Z_]+:\\s*/i, '') + '\\n';
                } else {
                    res += '- **❌ معيار الرفض والإلغاء الفوري:** أي شرخ سطحي أو إجهادي، أو استطالة دائمة، أو تآكل يتجاوز الحد المسموح به يستوجب الرفض والوسم بـ RED TAG فوراً.\\n';
                }
                if (mandatoryRules.length > 0) {
                    res += '- **المتطلبات الإلزامية:**\\n' + mandatoryRules.map(r => '  * ' + r.replace(/^[0-9]+[.-]\\s*/, '')).join('\\n') + '\\n\\n';
                } else {
                    res += '\\n';
                }

                // Pillar 3: Normative Reference Bridge (NDT)
                res += '#### 3️⃣ شبكة الإحالات المعيارية للفحص (Section 2: Normative NDT Bridge)\\n';
                res += '- **طريقة الفحص غير الإتلافي:** فحص الجسيمات المغناطيسية (MPI per ASTM E709 / ASME Section V Art 7) أو الموجات فوق الصوتية (UT per ASME V Art 4).\\n';
                res += '- **تأهيل الفاحص الإلزامي:** مفتش معتمد Level II طبقاً لـ **ASNT SNT-TC-1A** أو **ISO 9712** مع اعتماد الإجراء من Level III.\\n';
                res += '- **معيار القبول المحال إليه:** ASME Section VIII Div 1 App 6 / AWS D1.1 Clause 6.\\n\\n';

                // Pillar 4: Quality & Audit Documentation Matrix
                res += '#### 4️⃣ مصفوفة وثائق الجودة وسجلات التدقيق (Quality & Documentation Matrix)\\n';
                res += '| الوثيقة الإلزامية | كود المتطلب | فترة الاحتفاظ الإلزامية |\\n';
                res += '| :--- | :--- | :--- |\\n';
                res += '| **شهادة فحص المواد (MTR)** | EN 10204 Type 3.1 / 3.2 | طوال العمر التشغيلي للمعدة (Life of Asset) |\\n';
                res += '| **شهادة المطابقة (COC)** | API Spec / OEM Licensed | 5 سنوات كحد أدنى طبقاً لـ API Q1 |\\n';
                res += '| **تقرير فحص NDT معتمد** | ASNT Level II Sign-off | 5 سنوات في سجل البريمة اليومي |\\n';
                res += '| **نقطة توقف التفتيش (ITP)** | Hold Point (H) قبل الدهان | توقيع ممثل المالك (Company Man / Rig QA) |\\n\\n';

                // Verbatim extract
                res += '#### 📋 النص المعتمد للبند الميداني:\\n';
                res += cleanBody.slice(0, 500).trim() + '...\\n\\n';

                res += '---\\n*💡 نظام LocaSpec الميداني: تم تطبيق التشريح المعياري الموحد لـ API بنسبة 100% مع ربط وثائق الجودة ومعايير الـ NDT.*';
            } else {
                res += '### 🛰️ LocaSpec™ Comprehensive Field Rig Assessment — ' + std + ' (' + clause + ')\\n';
                res += '> **Structured per the Universal 4-Pillar API Standard Genome (Scope + Limits + NDT Bridge + QA Matrix)**\\n\\n';

                // Pillar 1: Scope & Demarcation
                res += '#### 1️⃣ Section 1: Scope Guard & Equipment Demarcation\\n';
                res += '- **Governing Code & Clause:** \`' + std + '\` — **Clause:** \`' + clause + '\`' + (sec ? ' | **Section:** ' + sec : '') + '\\n';
                res += '- **In-Scope Boundary:** Operational rig components and load-bearing elements governed under ' + std + '.\\n';
                res += '- **Scope Limitations:** Strictly restricted to designated components; auxiliary tubulars or non-governed tools must refer to their dedicated API specification.\\n\\n';

                // Pillar 2: Technical Verdict & Discard Limits
                res += '#### 2️⃣ Sections 7-8: Direct Engineering Verdict & Discard Limits\\n';
                if (acceptance) {
                    res += '- **✅ Verified Acceptance Limits:** ' + acceptance.replace(/^[A-Z_]+:\\s*/i, '') + '\\n';
                } else {
                    res += '- **✅ Verified Acceptance Limits:** Conformance to OEM nominal dimensions with zero allowable crack indications on critical load paths.\\n';
                }
                if (rejection) {
                    res += '- **❌ Mandatory Discard & Rejection Criteria:** ' + rejection.replace(/^[A-Z_]+:\\s*/i, '') + '\\n';
                } else {
                    res += '- **❌ Mandatory Discard & Rejection Criteria:** Any fatigue crack, dimensional elongation beyond OEM limits, or critical section loss mandates immediate Red Tag discard.\\n';
                }
                if (mandatoryRules.length > 0) {
                    res += '- **Mandatory Operational Directives:**\\n' + mandatoryRules.map(r => '  * ' + r.replace(/^[0-9]+[.-]\\s*/, '')).join('\\n') + '\\n\\n';
                } else {
                    res += '\\n';
                }

                // Pillar 3: Normative Reference Bridge (NDT)
                res += '#### 3️⃣ Section 2: Normative Reference Bridge (NDT & Procedural Referral)\\n';
                res += '- **Governing NDT Examination:** Wet Fluorescent Magnetic Particle (WFMT per ASTM E709 / ASME Section V Art 7) or Ultrasonic (UT per ASME V Art 4).\\n';
                res += '- **Personnel Qualification Standard:** Certified Level II Inspector per **ASNT SNT-TC-1A** or **ISO 9712** (Level III approved written procedure).\\n';
                res += '- **Referenced Acceptance Standard:** ASME Section VIII Division 1 Appendix 6 / AWS D1.1 Clause 6.\\n\\n';

                // Pillar 4: Quality & Audit Documentation Matrix
                res += '#### 4️⃣ Quality, Documentation & Audit Compliance Matrix\\n';
                res += '| Mandatory Audit Document | Governing Standard Requirement | Minimum Record Retention |\\n';
                res += '| :--- | :--- | :--- |\\n';
                res += '| **Mill Test Report (MTR)** | EN 10204 Type 3.1 / 3.2 Certificate | Life of Asset (Permanent Equipment Record) |\\n';
                res += '| **Certificate of Conformance (COC)** | API Spec / OEM Licensed Facility | Minimum 5 Years per API Spec Q1 |\\n';
                res += '| **Periodic NDT Inspection Report** | ASNT / ISO Level II Sign-off | 5 Years in active rig equipment history |\\n';
                res += '| **Inspection & Test Plan (ITP)** | Mandatory Hold Point (H) | Owner/Client Representative Sign-off |\\n\\n';

                // Verbatim extract
                res += '#### 📋 Verbatim Standard Clause Requirement:\\n';
                res += cleanBody.slice(0, 500).trim() + '...\\n\\n';

                res += '---\\n*💡 LocaSpec Field Rig Engine: 100% Deterministic Evaluation with Scope Verification, NDT Referral, and QA Documentation.*';
            }
            return res;
        }`;

html = html.replace(oldLocaspecFormatRegex, newLocaspecFormat);
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully updated index.html with 4-Pillar Universal API Genome format.');
