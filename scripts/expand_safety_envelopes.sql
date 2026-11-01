-- Expand code_safety_envelopes with P-8, P-15E, API 5L, and Inconel 625/825
INSERT INTO code_safety_envelopes (
  material_group, min_preheat_c, min_preheat_f, max_interpass_c, max_interpass_f,
  pwht_thickness_threshold_mm, pwht_min_temp_c, pwht_max_temp_c, max_hardness_hrc,
  governing_standard, is_active
) VALUES 
(
  'P-No. 8 (Austenitic SS 304/316)',
  10, 50, 175, 350,
  NULL, NULL, NULL, 22,
  'ASME B31.3 Table 330.1.1 / Table 331.1.1 / NACE MR0175',
  1
),
(
  'P-No. 15E (P91 / Grade 91)',
  200, 400, 300, 575,
  0.0, 730, 775, 23,
  'ASME B31.3 Table 330.1.1 / Table 331.1.1',
  1
),
(
  'API 5L Line Pipe (X52-X70)',
  50, 122, 250, 482,
  19.05, 595, 650, 22,
  'API 1104 Section 5 / NACE MR0175 / ISO 15156',
  1
),
(
  'Nickel Alloy (Inconel 625 / 825)',
  10, 50, 150, 300,
  NULL, NULL, NULL, 35,
  'ASME Section IX P-43/45 / NACE MR0175 Table A.13',
  1
);
