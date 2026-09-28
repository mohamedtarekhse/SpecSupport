const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'standards', 'OEM_BOP_Operations_and_Repair.txt');

const content = `[STANDARD: OEM MANUALS / API 16A / API 16D]
[TITLE: Original Equipment Manufacturer (OEM) BOP Operations, Maintenance & Repair Manual]
[EDITION: Cameron Type U / Hydril GK / NOV Shaffer SL / Koomey API 16D OEM Guidelines]
[ARTICLE: Field Standard Operating Procedures (SOP), Overhaul Dimensions, Assembly & Repair]

Clause 1.1 — Cameron Type U Ram BOP: Step-by-Step Ram Change Procedure
The Cameron Type U Ram Blowout Preventer utilizes hydraulic pressure to open and close bonnets for ram changing. To change ram assemblies safely in the field:
1. Ensure the wellbore is completely dead, depressurized, and verified with open flow check. Lock out and tag out the BOP hydraulic operating controls.
2. Vent hydraulic pressure from both the closing chamber and wedgelock/poslock lines.
3. Loosen and completely remove the bonnet bolts using an approved hydraulic torque wrench or heavy impact wrench.
4. Turn the bonnet control valve to the "OPEN" position. Hydraulic fluid enters the bonnet opening cylinder, extending the bonnet assembly clear of the BOP body cavity on its hinge pins.
5. Apply hydraulic closing pressure slowly until the ram blocks extend 2 to 3 inches out of the cavity, exposing the T-slot connection.
6. Slide the ram block horizontally off the T-head of the operating piston rod. Never use steel sledgehammers directly on the ram body; utilize a brass drift or designated nylon lifting sling.
7. Clean and inspect the ram guide ribs, body cavity, and operating piston rod seal area thoroughly.
8. Coat the T-head and ram slot with high-pressure anti-seize grease (API modified or copper-based grease).
9. Slide the new or redressed ram block onto the T-head, ensuring correct orientation (packer face toward wellbore center, top seal oriented upward).
10. Shift the bonnet control valve to "CLOSE" position to retract the bonnets smoothly into the body cavity.
11. Clean, lubricate, and reinstall bonnet bolts. Torque bolts in a crisscross star pattern to the OEM specified torque: for 13-5/8" 10K Type U, torque to 3,200 ft-lbs (4,340 N·m) using certified calibrated torque equipment.
ACCEPTANCE: Ram block slides freely onto T-head; bonnets seat metal-to-metal against body face; zero binding during hydraulic stroke test.
REJECTION: Forcing bonnets closed with misaligned ram blocks; using damaged bonnet bolts or failing to torque bolts in the specified star pattern.
ARABIC: إجراء تغيير رامات مانع الانفجار كاميرون تايب يو (Cameron Type U Ram Change SOP).
---

Clause 1.2 — Cameron Type U Ram Packer and Top Seal Rubber Replacement
Ram elastomers must be replaced whenever excessive wear, hardening, chunking, or extrusion is detected during visual examination or following pressure test failure:
1. Position the removed ram block securely in a dedicated ram maintenance fixture.
2. Remove the top seal rubber: extract the two retaining pins located at the rear corners of the top seal using a pin punch, then pry the top seal upward out of its dovetail groove.
3. Remove the front packer: drive out the two packer retaining pins from the side of the ram block, and pull the front packer rubber forward out of the ram face.
4. Clean the ram body dovetail grooves thoroughly with mineral spirits and a wire brush; inspect the steel lips of the dovetail groove for mechanical deformation or erosion.
5. Inspect the ram block wear pads: measure wear pad thickness with an outside micrometer. Wear pad clearance to body bore must not exceed 0.060 inches (1.52 mm).
6. Install the new front packer: coat the packer groove with light grease; press the new packer into position until side pin holes align exactly, then drive in new packer retaining pins until flush.
7. Install the new top seal: press the seal firmly into the top dovetail groove, ensuring the steel pins are fully driven home to prevent seal lifting during wellbore pressure exposure.
ACCEPTANCE: Packer and top seal fit snugly in grooves with zero bulging; retaining pins fully seated flush with ram block surface.
REJECTION: Reusing retaining pins or installing elastomers that exceed the 5-year OEM shelf-life expiration date or show ozone cracking.
ARABIC: تغيير مطاط الرام العازل والعلوي كاميرون (Ram Packer & Top Seal Replacement).
---

Clause 1.3 — Cameron Type U Bonnet Seal Ring and Cavity Inspection Criteria
The bonnet seal ring provides the primary containment barrier between the BOP body and the bonnet. Whenever bonnets are opened, rigorous inspection of the sealing surfaces is mandatory:
1. Remove the elastomeric bonnet seal ring and thoroughly clean the seal groove in the bonnet face and the mating sealing bore in the BOP body.
2. Visual and Dimensional Inspection: Inspect the 23-degree conical sealing taper of the body bore. The sealing band width must be completely free of scratches, scores, pits, or washouts.
3. Rejection Thresholds: Pitting or corrosion within the sealing band deeper than 0.010 inches (0.25 mm) or wider than 0.030 inches (0.76 mm) is rejectable and requires field remachining or weld buildup and stress relief per Cameron OEM repair specification.
4. Non-Destructive Examination (NDE): Perform Magnetic Particle Inspection (MPI per ASME V Article 7) or Liquid Penetrant Inspection (PT per ASME V Article 6) on the bonnet bolt tapped holes and the inner corner radii of the bonnet hinge lugs. Zero linear indications or cracks are permitted.
5. Installation: Always install a brand-new Cameron OEM bonnet seal ring; never reuse a disturbed bonnet seal ring. Lightly lubricate the seal ring with clean hydraulic oil or silicone grease prior to closing.
ACCEPTANCE: Sealing band 100% free of pitting; zero MPI crack indications on bonnet hinge ears; brand-new OEM seal ring installed.
REJECTION: Reusing disturbed bonnet seal rings or attempting to stop a bonnet seal leak by overtightening bolts beyond maximum torque limits.
ARABIC: معايير فحص أختام البونت وتجاويف كاميرون (Cameron Bonnet Seal & Cavity Inspection).
---

Clause 1.4 — Cameron Wedgelock and Poslock Operating Sequences and Pressure Limits
Cameron Wedgelock and Poslock operators provide mechanical locking of the ram assembly in the closed position to hold wellbore pressure without requiring continuous hydraulic closing pressure:
1. Normal Closing Sequence: Apply 1,500 psi hydraulic pressure to the "RAM CLOSE" port. Once the rams are fully closed, apply 1,500 psi hydraulic pressure to the "WEDGELOCK CLOSE" port. The internal hydraulic wedge drives behind the operating piston tail rod, mechanically locking the ram against the wellbore.
2. Normal Opening Sequence (CRITICAL): Always apply 1,500 to 3,000 psi hydraulic pressure to the "WEDGELOCK OPEN" port FIRST. The wedge must be hydraulically retracted clear of the tail rod before opening pressure is applied to the main operating piston. Once wedgelocks are fully retracted, apply hydraulic pressure to the "RAM OPEN" port.
3. Locking Pressure Limits: Maximum allowable wedgelock operating pressure is 3,000 psi (20.7 MPa). Normal operating pressure is 1,500 psi (10.3 MPa).
4. Manual Override Operation: If hydraulic power is lost, wedgelocks and Type U manual locking screws can be operated manually using the rig floor extension handwheels. Count the exact number of turns required to close and lock (for 13-5/8" Type U, typically 28 to 36 turns depending on ram bore). Always record turn counts in the daily drilling log.
ACCEPTANCE: Wedgelock fully unlocks before main piston actuation; operating pressure holds static without bypass leakage.
REJECTION: Applying main ram opening pressure while wedgelock is still engaged in the locked position, which shears the internal locking wedge mechanism.
ARABIC: تشغيل أقفال الويدج لوك الهيدروليكية كاميرون (Cameron Wedgelock Operating SOP).
---

Clause 2.1 — Hydril GK Annular BOP: Packing Element Replacement SOP
The Hydril GK Annular BOP utilizes a cartridge-type elastomeric packing unit with molded steel reinforcing segments designed to close around any drill string geometry or complete shut-off (CSO). To replace the packing element:
1. Ensure the BOP stack and wellhead are depressurized and vented to 0 psi. Isolate all hydraulic lines to the closing and opening chambers.
2. Unscrew and remove the head cover lock screws and remove the split lock rings (or unbolt the bolted head, depending on GK model).
3. Attach certified lifting slings to the two dedicated eye bolts on the BOP head. Lift the head vertically off the body using the rig hoist, taking care not to damage internal seal surfaces.
4. Screw the dedicated Hydril packing unit lifting eye into the threaded center hole of the packing element.
5. Lift the worn packing element straight up out of the spherical bowl cavity.
6. Thoroughly clean the inner spherical bowl of the piston and the underside of the head using non-chlorinated solvent and lint-free rags.
7. Inspect the spherical bowl surface for corrosion, pitting, and grooving. Smooth minor scratches using 400-grit emery cloth in a circumferential motion. Deep scoring (> 0.030 in) requires OEM shop re-machining.
8. Lubricate the bowl surface and the outside diameter of the new packing unit generously with clean, lightweight vegetable oil, light mineral oil, or approved Hydril lubricant. Never use heavy hydrocarbon grease or pipe dope, which causes swelling and rapid degradation of nitrile and neoprene elastomers.
9. Lower the new packing element into the bowl, ensuring correct centering. Reinstall the head, reinstall lock rings, and torque head locking screws to OEM specifications (for 13-5/8" GK, torque lock ring screws to 350-400 ft-lbs).
ACCEPTANCE: Head locked securely with uniform clearance around circumference; element moves smoothly without binding during hydraulic function test.
REJECTION: Installing packing units with torn steel reinforcement ribs or applying hydrocarbon pipe dope to elastomeric packing units.
ARABIC: استبدال كاوتشة مانع الانفجار الحلقي هيدريل (Hydril GK Annular Element Replacement).
---

Clause 2.2 — Hydril Annular BOP Stripping Operations and Hydraulic Pressures
During well control operations, it may become necessary to strip drill pipe into or out of the hole through a closed annular BOP under pressure. Strict hydraulic pressure regulation is mandatory to prevent tearing the packing unit:
1. Normal Static Closing Pressure: Set the hydraulic regulator on the accumulator control panel between 800 psi and 1,500 psi (5.5 to 10.3 MPa) depending on wellbore pressure.
2. Stripping Operations Pressure Reduction: When stripping tool joints through the closed annular, reduce the closing pressure regulator to the minimum pressure that holds a bubble-tight seal around the pipe body (typically 400 to 700 psi / 2.8 to 4.8 MPa).
3. Tool Joint Passage Surge: As a tool joint enters the packing element, it displaces fluid from the closing chamber. An operational surge bottle (accumulator precharged to 400-500 psi N2) must be connected directly to the closing line to absorb the displaced hydraulic volume and prevent pressure spikes that rip the rubber.
4. Stripping Speed Limit: Maximum pipe running speed during stripping through an annular must not exceed 1 foot per second (0.3 m/s) to avoid excessive frictional heat buildup.
ACCEPTANCE: Controlled minor seepage (lubricating film of mud/water) permitted around pipe during stripping; packing element maintains pressure integrity across tool joints.
REJECTION: Stripping at full closing pressure (> 1,000 psi) which causes instantaneous delamination and blowout of packing element rubber segments.
ARABIC: ضغوط تشغيل الإنزال القسري لمواسير الحفر (Annular Stripping Pressures).
---

Clause 2.3 — Hydril Annular Piston Seals and Telltale Weep Hole Inspection
Hydril Annular preventers are equipped with a telltale weep hole drilled through the body wall between the upper and lower piston seal sets to immediately identify seal failure:
1. Operational Inspection: During pressure tests and daily rig rounds, visually inspect the exterior telltale weep hole.
2. Fluid Identification:
   - If hydraulic oil escapes from the weep hole: The lower piston seal (hydraulic operating chamber seal) has failed.
   - If drilling fluid, gas, or wellbore water escapes from the weep hole: The upper piston seal (wellbore containment seal) has failed.
3. Repair Action: If either seal is leaking, the BOP cannot be certified for drilling operations. The preventer must be depressurized, disassembled, and the complete piston seal package (U-cups, chevron packings, and wear rings) replaced.
ACCEPTANCE: Zero leakage (dry weep hole) during both low-pressure (250-350 psi) and high-pressure operational tests.
REJECTION: Operating a well with a plugged or leaking telltale weep hole; plugging a weep hole to conceal seal failure is a critical safety violation.
ARABIC: فحص فتحة المراقبة والتسريب لمانع الانفجار هيدريل (Hydril Telltale Weep Hole Inspection).
---

Clause 3.1 — NOV Shaffer LWS and SL Ram BOP Door Maintenance and Overhaul
NOV Shaffer LWS and SL Ram BOPs feature hinged doors that swing open horizontally for rapid ram replacement:
1. Open Door Procedure: Vent hydraulic operating pressure. Remove the heavy door cap screws. Swing the door open manually on its heavy-duty hinges.
2. Ram Removal: The ram assembly is secured to the piston rod via a vertical sliding slot. Lift the ram vertically off the rod foot.
3. Lip Seal & Cylinder Inspection: Inspect the door lip seal and O-ring. Inspect the inner cylinder bore for corrosion or scoring. Piston stroke bore surface finish must be 16 to 32 RMS.
4. Hard Chrome Plating Criteria: Inspect the piston rod hard chrome plating. Flaking, blistering, or pitting in the dynamic seal stroke travel area exceeding 0.005 inches (0.13 mm) depth requires rod replacement or industrial hard chrome replating.
5. Door Bolt Torque: Reinstall doors, apply anti-seize, and torque door cap screws in a cross pattern: for 11" 5K/10K LWS, torque to 1,800-2,000 ft-lbs (2,440-2,710 N·m).
ACCEPTANCE: Door swings smoothly with zero hinge sag; chrome plating mirror-smooth across stroke travel.
REJECTION: Scoring in cylinder bore deeper than 0.015 inches (0.38 mm) or chrome flaking on piston rod.
ARABIC: صيانة أبواب مانع الانفجار شافر إل دبليو إس (NOV Shaffer LWS Door Maintenance).
---

Clause 4.1 — Accumulator Unit (Koomey / CAD / API 16D) Nitrogen Precharge SOP
The hydraulic accumulator control system provides the stored energy required to close all BOP functions within API Standard 53 time limits (annular within 30 seconds for < 20", rams within 30 seconds). Regular nitrogen precharge verification of the accumulator bottles is mandatory:
1. Isolation: Shut down all electric and pneumatic hydraulic charge pumps. Isolate the accumulator bank from the control manifold.
2. Hydraulic Depressurization: Open the manual accumulator bleed-off valve to drain all hydraulic fluid from the bottles back into the reservoir tank until the hydraulic pressure gauge reads exactly 0 psi.
3. Precharge Measurement: Remove the protective cap from the gas valve at the top of each bottle. Attach a certified nitrogen charging and testing manifold equipped with a calibrated 0-3,000 psi test gauge. Slowly turn the manifold T-handle clockwise to depress the valve core and read the static nitrogen pressure.
4. Precharge Specifications (at 70°F / 21°C ambient):
   - For 3,000 psi Working Pressure System: Nitrogen precharge must be 1,000 psi ± 100 psi (6.9 MPa ± 0.7 MPa).
   - For 5,000 psi Working Pressure System: Nitrogen precharge must be 1,500 psi ± 100 psi (10.3 MPa ± 0.7 MPa).
5. Adjustment: If precharge is low, connect a certified commercial cylinder of dry nitrogen (N2) with high-pressure charging hose and regulator. Slowly fill bottle to specified pressure. Never use compressed air or pure oxygen under any circumstances (oxygen in contact with hydraulic oil causes catastrophic diesel explosion).
6. Leak Check: Apply soapy water solution to the valve core and base threads. Zero bubbling permitted over a 2-minute observation period. Reinstall metal cap.
ACCEPTANCE: Precharge within ±10% of nominal design pressure (1,000 psi ± 100 psi); zero leakage on valve cores.
REJECTION: Using oxygen or shop air for accumulator charging; operating with precharge below 900 psi on a 3,000 psi accumulator unit.
ARABIC: شحن غاز النيتروجين لوحدات الكومي طبقاً لـ API 16D (Koomey Accumulator N2 Precharge).
---

Clause 4.2 — Accumulator Usable Fluid Volume and Pump Recovery Time Requirements
Per API Specification 16D and API Standard 53, the accumulator control unit must meet rigorous capacity and recovery criteria:
1. Usable Fluid Capacity: The accumulator unit must have sufficient stored usable hydraulic volume to close all ram BOPs, close the annular BOP, open the hydraulic choke line valve (HCR), and maintain a minimum remaining pressure of 200 psi above the nitrogen precharge pressure (minimum 1,200 psi remaining on a 3,000 psi system) without restarting the recharge pumps.
2. Total Stored Volume Rule: Total stored volume must equal at least 1.5 times the usable fluid volume required for complete stack closure (or per local regulatory requirement).
3. Pump Recovery Time: With the accumulator bottles drained to precharge pressure, the combined primary pump (electric triplex) and secondary pump (air-driven pumps) must recharge the entire accumulator system from precharge to the maximum rated working pressure (3,000 psi) in less than 15 minutes.
ACCEPTANCE: Minimum 1,200 psi pressure remaining after complete function actuation; pump recovery time < 15 minutes.
REJECTION: Remaining accumulator pressure falling below 1,200 psi (precharge + 200 psi) after full function actuation; pump recovery time exceeding 15 minutes requires immediate pump overhaul.
ARABIC: سعة وحسابات حجم الزيت الفعال لوحدة الكومي (Accumulator Usable Fluid Capacity).
---
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully created standards/OEM_BOP_Operations_and_Repair.txt with length:', content.length);
