// scripts/ingest_asme_ix_qw422_materials.js
// ROOT-CAUSE FIX for Test 3.1 (Test 3.1 negative control FAIL):
// The corpus had ZERO ASME IX Table QW/QB-422 base-metal rows, so P-No./Group No.
// queries were answered from model memory (hedging, 1-in-3 variance producing
// "Group Number 1" for SA-516 Gr 70). This injects curriculum-verified atomic rows.
//
// SOURCE OF TRUTH: Table QW/QB-422, ASME BPVC Section IX (2019 ED) — verified 2026-11-05:
//   A/SA-516 Gr 55  K01800  55(380)  P-No.1  Gr.No.1  C-Si
//   A/SA-516 Gr 60  K02100  60(415)  P-No.1  Gr.No.1  C-Mn-Si
//   A/SA-516 Gr 65  K02403  65(450)  P-No.1  Gr.No.1  C-Mn-Si
//   A/SA-516 Gr 70  K02700  70(485)  P-No.1  Gr.No.2  C-Mn-Si
//   A/SA-106 Gr A   K02501  48(330)  P-No.1  Gr.No.1  C-Si
//   A/SA-106 Gr B   K03006  60(415)  P-No.1  Gr.No.1  C-Mn-Si
//   A/SA-106 Gr C   K03501  70(485)  P-No.1  Gr.No.2  C-Mn-Si
//   A/SA-105        K03504  70(485)  P-No.1  Gr.No.2  C
//   A/SA-333 Gr 6   K03006  60(415)  P-No.1  Gr.No.1  C-Mn-Si
//   A/SA-335 P91    K90901  85(585)  P-No.15E Gr.No.1 9Cr-1Mo-V
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const workerDir = path.join(__dirname, '../worker');

const normativeRefs = 'ASME Section II Part D (SMYS/SMTS) | ASME Section VIII Div 1 (UG-84 Impact) | ASME B31.3 (Table 323.2.2) | API 510 / API 570 (In-Service Material ID)';
const qaDocs = 'WPS/EWP (QW-482) | PQR/WPQ (QW-483/484) | Certified MTR / EN 10204 3.1';

const newChunks = [
  {
    standard_code: 'ASME IX',
    standard_name: 'ASME Boiler and Pressure Vessel Code Section IX - Welding, Brazing, and Fusing Qualifications',
    section: 'QW-420 — Material Groupings',
    clause: 'QW/QB-422 — Base Metal P-Number and Group Number Assignments (Pressure Boundary Carbon Steels)',
    pillar_type: 'PREQUAL_WPS',
    in_scope: 'P-No./Group-No. lookup for common pressure-boundary carbon steels (Plate, Seamless Pipe, Fittings)',
    out_of_scope: 'Materials not listed here must be looked up directly in Table QW/QB-422 of the referenced Section IX edition',
    acceptance_limits: 'ACCEPTANCE: Production base metal matches the P-No./Gr.No. of the qualified PQR (per QW-424 pairing verified Essential Variable compliance).',
    rejection_limits: 'REJECTION: Production weld executed with a base metal whose P-No. differs from that qualified on the WPS, without requalification.',
    qa_docs: qaDocs,
    normative_refs: normativeRefs,
    content: `[STANDARD: ASME IX] [TITLE: ASME Boiler and Pressure Vessel Code Section IX - Welding, Brazing, and Fusing Qualifications] [SECTION: QW-420 — Material Groupings] [CLAUSE: QW/QB-422 — Base Metal P-Number and Group Number Assignments]

[CLAUSE: Table QW/QB-422 — Pressure Boundary Carbon Steel Assignments (ASME Section IX, 2019 ED)]
Verified atomic rows from Table QW/QB-422 (Spec Min Tensile ksi(MPa) | P-No. | Group No. | UNS | Nominal Composition | Product Form):
1. A/SA-516 Gr 55: 55 ksi (380 MPa) | P-No. 1 | Group No. 1 | UNS K01800 | C-Si | Plate.
2. A/SA-516 Gr 60: 60 ksi (415 MPa) | P-No. 1 | Group No. 1 | UNS K02100 | C-Mn-Si | Plate.
3. A/SA-516 Gr 65: 65 ksi (450 MPa) | P-No. 1 | Group No. 1 | UNS K02403 | C-Mn-Si | Plate.
4. A/SA-516 Gr 70: 70 ksi (485 MPa) | P-No. 1 | Group No. 2 | UNS K02700 | C-Mn-Si | Plate.
5. A/SA-106 Gr A: 48 ksi (330 MPa) | P-No. 1 | Group No. 1 | UNS K02501 | C-Si | Seamless pipe.
6. A/SA-106 Gr B: 60 ksi (415 MPa) | P-No. 1 | Group No. 1 | UNS K03006 | C-Mn-Si | Seamless pipe.
7. A/SA-106 Gr C: 70 ksi (485 MPa) | P-No. 1 | Group No. 2 | UNS K03501 | C-Mn-Si | Seamless pipe.
8. A/SA-105: 70 ksi (485 MPa) | P-No. 1 | Group No. 2 | UNS K03504 | C | Flanges & fittings.
9. A/SA-333 Gr 6: 60 ksi (415 MPa) | P-No. 1 | Group No. 1 | UNS K03006 | C-Mn-Si | Seamless & welded pipe.
RULE: In Table QW/QB-422, Group Numbers subdivide P-No. 1 into Group No. 1, 2 and 3 for toughness-based qualification; the SA-516 Grade 70 plate entry is P-No. 1, Group No. 2.
ACCEPTANCE: Production base metal P-No. and Group No. match the qualified PQR base-metal pairing per QW-424, and all Essential Variables hold.
REJECTION: Welding a production base metal whose P-No. differs from the WPS-qualified P-No. (QW-403 — essential variable) without new PQR and WPS requalification.`
  },
  {
    standard_code: 'ASME IX',
    standard_name: 'ASME Boiler and Pressure Vessel Code Section IX - Welding, Brazing, and Fusing Qualifications',
    section: 'QW-420 — Material Groupings',
    clause: 'QW-420.1 — P-Number System and Group Number Sub-classification (Ferrous Families)',
    pillar_type: 'PREQUAL_WPS',
    in_scope: 'General P-No. family ranges and Cr-Mo/CSEF assignments used for WPS qualification scope extenders',
    out_of_scope: 'Non- ferrous families (P-21 to P-26, P-31, P-41, P-51, P-61) list only analogous ranges; consult Table QW/QB-422',
    acceptance_limits: 'ACCEPTANCE: WPS scope extension permitted between base metals of the SAME P-No. (any Group No.) when impact testing is NOT invoked; Group No. becomes Supplementary Essential Variable when UG-84 impact testing applies.',
    rejection_limits: 'REJECTION: Qualifying a PQR on one P-No. and welding production on another P-No. — mandatory requalification (no Group-Number extension rescues a P-No. change).',
    qa_docs: qaDocs,
    normative_refs: normativeRefs,
    content: `[STANDARD: ASME IX] [TITLE: ASME Boiler and Pressure Vessel Code Section IX - Welding, Brazing, and Fusing Qualifications] [SECTION: QW-420 — Material Groupings] [CLAUSE: QW-420.1 — P-Number System Overview]

[CLAUSE: QW-420.1 — Material Groupings: P-Number and S-Number System]
1. PURPOSE: Base metals are assigned P-Numbers for procedure qualification to reduce the number of qualification tests. Ferrous P-Numbers: P-No. 1 through P-No. 15F (per Table QW/QB-422).
2. FERROUS FAMILY RANGES:
   - P-No. 1: Carbon and low-alloy steels (C-Mn, C-Mn-Si). Examples: A/SA-516 Gr 55/60/65/70, A/SA-106 Gr A/B/C, A/SA-105, A/SA-333 Gr 6, A/SA-234 WPB, A/SA-36, A/SA-285.
   - P-No. 3: Low Cr-Mo (1/2Cr-1/2Mo, 1Cr-1/2Mo, 1/4Mo). Examples: A/SA-182 F1/F2, A/SA-204 A/B/C, A/SA-209 T1, A/SA-335 P1.
   - P-No. 4: 1-1/4Cr-1/2Mo, 2Cr-1/2Mo. Examples: A/SA-182 F11/F12, A/SA-213 T11/T12, A/SA-335 P11/P12.
   - P-No. 5A: 2-1/4Cr-1Mo, 3Cr-1Mo. Examples: A/SA-182 F21/F22, A/SA-213 T22, A/SA-335 P22.
   - P-No. 5B: 5Cr-1/2Mo, 9Cr-1Mo. Examples: A/SA-213 T5/T9, A/SA-182 F5/F9.
   - P-No. 8: Austenitic Stainless Steels. Examples: A/SA-213 TP304/304L/316/316L, A/SA-182 F304/F316, A/SA-240 Gr 304/316.
   - P-No. 15E: 9Cr-1Mo-V-Nb CSEF (Grade 91). Examples: A/SA-213 T91, A/SA-182 F91, A/SA-335 P91 (UNS K90901) | P-No. 15E | Group No. 1.
   - P-No. 15F: 9Cr-2W CSEF (Grade 92). Examples: A/SA-213 T92, A/SA-182 F92, A/SA-335 P92.
3. GROUP NUMBER LOGIC: Group Numbers (Gr.No. 1, 2, 3 etc.) are toughness sub-classifications WITHIN a P-No. (Table QW/QB-422). A PQR qualified WITHOUT impact testing covers any Group No. in the same P-No.; if UG-84 / toughness testing is invoked, Group No. becomes a Supplementary Essential Variable and a Group-No. change triggers requalification with impact testing.
ACCEPTANCE: A single PQR on any P-No. 1 base metal qualifies a WPS for all P-No. 1 base metals (any Group No.) when no impact testing is invoked per QW-420.1.
REJECTION: A change in P-No. between QA/QC-qualified PQR and production WPS base metal is an Essential Variable change and mandates requalification.`
  }
];

function escapeSql(str) {
  if (!str) return "''";
  return "'" + str.replace(/'/g, "''") + "'";
}

const existing = escapeSql("QW/QB-422 — Base Metal P-Number and Group Number Assignments (Pressure Boundary Carbon Steels)");
const check = (res) => console.log(res);

// Insert chunks + sync FTS external content index in one atomic pass
const inserts = newChunks.map(ch => `INSERT INTO standards_chunks (standard_code, standard_name, section, clause, pillar_type, in_scope, out_of_scope, acceptance_limits, rejection_limits, qa_docs, normative_refs, content, scope, organization) VALUES (${escapeSql(ch.standard_code)}, ${escapeSql(ch.standard_name)}, ${escapeSql(ch.section)}, ${escapeSql(ch.clause)}, ${escapeSql(ch.pillar_type)}, ${escapeSql(ch.in_scope)}, ${escapeSql(ch.out_of_scope)}, ${escapeSql(ch.acceptance_limits)}, ${escapeSql(ch.rejection_limits)}, ${escapeSql(ch.qa_docs)}, ${escapeSql(ch.normative_refs)}, ${escapeSql(ch.content)}, 'global', 'ASME');`).join('\n\n');

const tempSqlFile = path.join(workerDir, 'temp_qw422_ingest.sql');
fs.writeFileSync(tempSqlFile, inserts + '\n\nINSERT INTO standards_fts(standards_fts) VALUES(\'rebuild\');', 'utf8');

console.log(`Wrote ${newChunks.length} INSERT + FTS rebuild to ${tempSqlFile}`);
const qRes = execSync('npx.cmd wrangler d1 execute inspection-db --remote --file=temp_qw422_ingest.sql', { cwd: workerDir, encoding: 'utf8' });
check(qRes);
fs.unlinkSync(tempSqlFile);
console.log('\n✅ Ingested. Now run POST /api/admin/backfill-embeddings batches to embed the 2 new (NULL-embedding) chunks.');
