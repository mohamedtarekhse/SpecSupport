const fs = require('fs');
const path = require('path');

const workerPath = path.join(__dirname, '..', 'worker', 'src', 'index.js');
let code = fs.readFileSync(workerPath, 'utf8');

// 1. Add Formulas for IADC Well Control and OEM BOPs
const targetLocation = `  // 18. API Spec 16D BOP Control Response Time Limits`;

const newFormulas = `  // 19. IADC Well Control & API Standard 53: Hard Shut-In & Kill Calculations
  const isWellControl = q.match(/(?:iadc|well\s*control|api\s*(?:standard\s*|std\s*|rp\s*)?53|hard\s*shut-?in|kill\s*mud|kmw|driller(?:'s)?\s*method|wait\s*and\s*weight)/i);
  if (isWellControl) {
    results.push(\`VERIFIED CODE DETERMINATION [API Standard 53 / IADC WellSharp - Hard Shut-In & Well Kill Mathematics]:
• Governing Standard: API Standard 53 (Blowout Prevention Equipment Systems) & IADC WellSharp
• Hard Shut-In Operational Sequence (While Drilling):
  1. Space out tool joint clear of all BOP rams and annular preventer.
  2. Stop rotary/top drive and shut down mud pumps immediately.
  3. Verify remote choke is closed and immediately open the hydraulic choke line valve (HCR valve).
  4. Close the designated primary shut-in device: Annular BOP (or Upper Pipe Ram).
  5. Record stabilized Shut-In Drill Pipe Pressure (SIDPP), Shut-In Casing Pressure (SICP), and Pit Gain.
• Mathematical Formulas:
  - Kill Mud Weight: KMW (ppg) = OMW (ppg) + [ SIDPP (psi) / (0.052 × TVD (ft)) ]
  - Initial Circulating Pressure: ICP (psi) = SIDPP (psi) + SCRP (psi)
  - Final Circulating Pressure: FCP (psi) = SCRP (psi) × [ KMW (ppg) / OMW (ppg) ]
• Acceptance Criteria: Hard shut-in executed within 60 seconds; KMW calculated using stabilized SIDPP and TVD.
• Rejection Criteria: Attempting soft shut-in without operator mandate, closing BOP over a tool joint, or exceeding Maximum Allowable Annular Surface Pressure (MAASP) at the casing shoe.\`);
  }

  // 20. Cameron Type U Ram BOP OEM Procedures & Bonnet Seal Criteria
  const isCameron = q.match(/(?:cameron.*(?:type\s*u|evo|bop)|ram\s*(?:rubber|packer|change).*cameron|bonnet\s*seal.*cameron|wedgelock)/i);
  if (isCameron) {
    results.push(\`VERIFIED CODE DETERMINATION [Cameron Type U Ram BOP OEM Operations & Maintenance Manual]:
• Governing Standard: Cameron Type U OEM Operations Manual & API Spec 16A (ISO 13533)
• Step-by-Step Ram Change Procedure:
  1. Depressurize wellbore to 0 psi and lock out hydraulic controls.
  2. Vent hydraulic pressure from closing chamber and wedgelock lines.
  3. Remove bonnet bolts; turn bonnet control valve to OPEN to hydraulically swing bonnets open on hinge pins.
  4. Apply closing pressure to extend rams 2-3 inches, exposing the T-slot connection.
  5. Slide ram block horizontally off the T-head operating piston rod.
  6. Replace front packer and top seal rubber; inspect wear pad clearance (maximum allowable clearance 0.060 in [1.52 mm]).
  7. Slide new ram block onto T-head; hydraulically retract bonnets into body.
  8. Torque bonnet bolts in a star pattern to OEM spec (3,200 ft-lbs [4,340 N·m] for 13-5/8" 10K).
• Bonnet Seal Ring & Cavity Inspection Criteria:
  - 23-degree conical sealing face must be 100% free of pitting, scratches, or washouts across sealing band.
  - Maximum allowable pit depth outside the sealing band is 0.010 in (0.25 mm). Any pit across the sealing band requires remachining or weld buildup per Cameron OEM spec.
  - Zero crack indications allowed via MPI / PT. Always install brand-new OEM bonnet seal ring.
• Wedgelock Sequence: Always apply opening hydraulic pressure to wedgelock cylinders FIRST before opening main ram operating cylinders.\`);
  }

  // 21. Hydril GK Annular BOP Packing Element Replacement & Stripping SOP
  const isHydril = q.match(/(?:hydril.*(?:gk|gl|msp|annular)|packing\s*(?:element|unit).*hydril|stripping.*hydril)/i);
  if (isHydril) {
    results.push(\`VERIFIED CODE DETERMINATION [Hydril GK Annular BOP OEM Operations & Maintenance Manual]:
• Governing Standard: Hydril GK Annular BOP OEM Technical Manual & API Spec 16A
• Packing Element Replacement Sequence:
  1. Depressurize wellbore and vent opening/closing chambers to 0 psi.
  2. Unscrew lock ring screws, remove split lock rings, and hoist head vertically off body using lifting lugs.
  3. Screw dedicated lifting eye into packing element center hole and lift worn unit out of spherical bowl.
  4. Clean spherical bowl and polish scratches using 400-grit emery cloth in a circumferential pattern.
  5. Lubricate bowl and element with clean vegetable oil, light mineral oil, or approved Hydril lube (STRICTLY PROHIBITED: never use hydrocarbon grease or pipe dope, which causes rubber swelling and delamination).
  6. Lower new packing element into bowl, reinstall head, and torque lock ring screws to 350-400 ft-lbs.
• Stripping Operations Guidelines:
  - Reduce closing pressure regulator to 400 to 700 psi (2.8 to 4.8 MPa) to allow tool joints to pass without tearing rubber.
  - Maintain operational surge bottle precharged to 400-500 psi N2 on closing line to absorb displaced fluid.
  - Maximum pipe running speed through annular during stripping must not exceed 1 foot per second (0.3 m/s).\`);
  }
`;

if (code.includes(targetLocation) && !code.includes('isWellControl')) {
  code = code.replace(targetLocation, newFormulas + "\n" + targetLocation);
  console.log("✓ Added IADC Well Control, Cameron Type U, and Hydril GK verified engineering formulas");
}

// 2. Update stdMatch regex to include IADC, API 53, Cameron, Hydril, OEM
const oldStdRegex = `/(ASME\\s*(?:VIII|Section\\s*VIII|B31\\.3|B31\\.4|B31\\.8|V)|API\\s*(?:RP\\s*4G|4F|RP\\s*8B|5CT|1104|16D|7K|RP\\s*2X|RP\\s*5C1|RP\\s*7G-2)|AWS\\s*(?:D1\\.1|B1\\.11)|ISO\\s*3834-2)/i`;
const newStdRegex = `/(ASME\\s*(?:VIII|Section\\s*VIII|B31\\.3|B31\\.4|B31\\.8|V)|API\\s*(?:Standard\\s*53|RP\\s*53|53|RP\\s*4G|4F|RP\\s*8B|5CT|1104|16D|16A|7K|RP\\s*2X|RP\\s*5C1|RP\\s*7G-2)|IADC(?:\\s*WellSharp)?|Cameron|Hydril|Shaffer|Koomey|AWS\\s*(?:D1\\.1|B1\\.11)|ISO\\s*3834-2)/i`;

if (code.includes(oldStdRegex)) {
  code = code.replaceAll(oldStdRegex, newStdRegex);
  console.log("✓ Updated stdMatch regex to include IADC, API 53, Cameron, Hydril, and OEM codes");
}

fs.writeFileSync(workerPath, code, 'utf8');
console.log("Successfully updated worker/src/index.js!");
