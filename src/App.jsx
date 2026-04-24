import { useState, useMemo, useEffect } from "react";

// ============================================================
// DATA — Embedded from WARBOUND_CS_v3_FIXED.xlsx
// ============================================================

const CHASSIS_DATA = {
  HEAVY: { BASE_HP: 80, BASE_DEF: 8, BASE_MOVE: 6, BASE_WEIGHT: 180, HP_MULT: 3, SLOT_ARMED: 2, SLOT_DEF: 2, SLOT_LEG: 1, SLOT_THR: 1, SLOT_UTIL: 1, ABILITY: "DEF tertinggi. Slot Armed 2. Akses IRON FRONT T0." },
  MEDIUM: { BASE_HP: 55, BASE_DEF: 5, BASE_MOVE: 10, BASE_WEIGHT: 100, HP_MULT: 3, SLOT_ARMED: 1, SLOT_DEF: 1, SLOT_LEG: 1, SLOT_THR: 1, SLOT_UTIL: 2, ABILITY: "Seimbang. Akses semua Job. Paling fleksibel." },
  LIGHT: { BASE_HP: 40, BASE_DEF: 3, BASE_MOVE: 14, BASE_WEIGHT: 50, HP_MULT: 2.5, SLOT_ARMED: 1, SLOT_DEF: 1, SLOT_LEG: 1, SLOT_THR: 1, SLOT_UTIL: 2, ABILITY: "★ GHOST PROTOCOL T0: +5 DEF threshold saat mobile (>50% Move)" },
};

const WEIGHT_LIMIT = { HEAVY: 100, MEDIUM: 70, LIGHT: 45 };

const JOBS = {
  "—": { STR: 0, DEX: 0, VIT: 0, AGI: 0, INT: 0, CHASSIS: "Any", skills: [] },
  PRAJURIT: { STR: 7, DEX: 4, VIT: 6, AGI: 2, INT: 1, CHASSIS: "Heavy", skills: [
    { name: "IRON FRONT", type: "Pasif", cat: "BATTLE", desc: "Saat HP SCAR <30%, DEF +2. Serangan ke rekan dalam 5m harus melewatimu." },
    { name: "WARCRY", type: "1×/misi", cat: "BATTLE", desc: "Semua rekan 10m: −1 DEF threshold + 1d6 dmg 2 ronde. Kamu FATIGUE." },
    { name: "FATIGUE", type: "Efek", cat: "BATTLE", desc: "−1 DEF threshold pribadi 1 ronde, hilang otomatis awal giliranmu." },
  ]},
  MERCENARY: { STR: 5, DEX: 5, VIT: 5, AGI: 3, INT: 2, CHASSIS: "Heavy/Med", skills: [
    { name: "Negosiasi", type: "Sosial", cat: "SOCIAL", desc: "Menaikkan kemampuan bernegosiasi (+d6)." },
    { name: "Investigasi", type: "Sosial", cat: "SOCIAL", desc: "Menaikkan kemampuan mencari informasi dari pihak lain (+d6)." },
    { name: "Taktik Pertempuran", type: "Pasif", cat: "BATTLE", desc: "Menaikkan prediksi serangan musuh (def −d4)." },
    { name: "BERSERK", type: "Reaksi", cat: "BATTLE", desc: "Menghilangkan damage 1 turn. Turn berikutnya setiap damage masuk dicek ×2." },
  ]},
  PENAMBANG: { STR: 5, DEX: 4, VIT: 6, AGI: 2, INT: 3, CHASSIS: "Heavy/Med", skills: [
    { name: "GEOLOGIC SENSE", type: "Pasif", cat: "BATTLE", desc: "GM beritahu Golem/jebakan/Omegitium dalam 20m meski ada tembok." },
    { name: "DEMOLITION EXPERT", type: "Aktif", cat: "BATTLE", desc: "Crafting explosive: DC −2. Roll ≥17: bonus tanpa cost ekstra." },
    { name: "TREMOR SENSE", type: "Free 1×/ronde", cat: "BATTLE", desc: "Scan 15m. Reveal weak spot 1 Golem → EXPOSED 1 ronde (+1d6/hit rekan)." },
  ]},
  MEDIS: { STR: 1, DEX: 4, VIT: 8, AGI: 3, INT: 4, CHASSIS: "Medium", skills: [
    { name: "COMBAT TRIAGE", type: "Pasif 1×/ronde", cat: "SUPPORT", desc: "Bonus Action: stabilkan pilot INJURED tanpa roll, tanpa Medical Kit." },
    { name: "FIELD TRIAGE", type: "Short Rest", cat: "SUPPORT", desc: "Pulihkan 1d8+VIT HP organik rekan tanpa material." },
    { name: "OMEG-STASIS", type: "1×/sesi", cat: "SUPPORT", desc: "Kurangi Grey Plague target 15 stack seketika." },
    { name: "RADIATION ANALYSIS", type: "Aktif", cat: "SUPPORT", desc: "Identifikasi level radiasi area dan estimasi durasi aman tanpa O-Blockers." },
  ]},
  PROGRAMER: { STR: 2, DEX: 4, VIT: 2, AGI: 5, INT: 7, CHASSIS: "Light/Med", skills: [
    { name: "GHOST IN THE MACHINE", type: "Pasif", cat: "BATTLE", desc: "DC 12 INT: deteksi sistem keamanan elektronik (turret/drone/AI/pintu)." },
    { name: "SYSTEM OVERRIDE", type: "1×/misi", cat: "BATTLE", desc: "Ambil alih 1 sistem elektronik musuh 2 ronde. DC 12–20." },
    { name: "GOLEM HACK", type: "Situasional", cat: "BATTLE", desc: "Golem berkomponen elektronik: DC 17 INT → program ulang targeting 1d4 ronde." },
    { name: "INT 5+ MARK", type: "Free 1×/ronde", cat: "BATTLE", desc: "Mark 1 target: −2 DEF threshold vs 1 rekan ronde ini." },
  ]},
  MEKANIK: { STR: 4, DEX: 6, VIT: 3, AGI: 3, INT: 4, CHASSIS: "Med/Light", skills: [
    { name: "FIELD REPAIR", type: "Pasif/Short Rest", cat: "SUPPORT", desc: "Repair 1d8 HP SCAR tanpa material. 1 Aksi Utama." },
    { name: "OVERHAUL", type: "1×/misi", cat: "SUPPORT", desc: "Repair 3d8 HP SCAR 1 unit. 2 Aksi Utama. Bisa saat combat." },
    { name: "SCRAP WIZARD", type: "Aktif", cat: "SUPPORT", desc: "Crafting Scrap+Elec: +2 roll. Full Action: +4 roll." },
    { name: "MODULE BYPASS", type: "1×/misi", cat: "SUPPORT", desc: "Pasang 1 modul tidak kompatibel 1 misi. Efek 75%. DC 15 DEX." },
  ]},
  ACCOUNTANT: { STR: 2, DEX: 5, VIT: 2, AGI: 4, INT: 7, CHASSIS: "Light", skills: [
    { name: "THREAT ASSESSMENT", type: "Pasif/Free 1×/ronde", cat: "SOCIAL", desc: "Mark 1 musuh: −2 DEF threshold vs 1 rekan ronde ini. Tidak butuh roll." },
    { name: "LEVERAGE", type: "Aktif", cat: "SOCIAL", desc: "Dalam negosiasi + tawarkan nilai ekonomi (GM): DC negosiasi −3." },
    { name: "PAYROLL MANAGEMENT", type: "1×/sesi", cat: "SOCIAL", desc: "Kurangi pengeluaran harian tim 20%. 1d6: 1-2 = palsu (efek setengah)." },
  ]},
};

const WEAPONS = [
  { name: "EMPTY", type: "—", dmg: "—", tags: "—", efek: "—", harga: 0, berat: 0 },
  { name: "AR-7 Rifle", type: "KINETIC", dmg: "18", tags: "STABLE", efek: "Standar militer performa konsisten.", harga: 25000, berat: 5 },
  { name: "Burst Carbine", type: "KINETIC", dmg: "20", tags: "BURST", efek: "+2 dmg jika pengguna tidak bergerak di giliran ini.", harga: 32000, berat: 4 },
  { name: "Heavy MG", type: "KINETIC", dmg: "22", tags: "SUPPRESS", efek: "Opsional: target −1 MOVE sampai akhir ronde berikutnya.", harga: 45000, berat: 6 },
  { name: "Combat Shotgun", type: "KINETIC", dmg: "21", tags: "CLOSE/BREACH", efek: "+1d6 jika menyerang pada jarak sangat dekat.", harga: 38000, berat: 5 },
  { name: "Marksman Rifle", type: "KINETIC", dmg: "19", tags: "PRECISION", efek: "Diam: weak hit +1d6, reroll 1 hasil d6 bonus.", harga: 36000, berat: 7 },
  { name: "Flame Unit", type: "THERMAL", dmg: "14", tags: "AREA/ANTI-LIGHT", efek: "+1d6 vs LIGHT armor atau target Exposed.", harga: 45000, berat: 7 },
  { name: "Grenade Launcher", type: "THERMAL", dmg: "16", tags: "EXPLOSIVE", efek: "AoE kecil; +1d6 vs LIGHT armor.", harga: 35000, berat: 5 },
  { name: "Thermal Cannon", type: "THERMAL", dmg: "20", tags: "HEAVY WEAPON", efek: "+1d6 jika target Exposed.", harga: 55000, berat: 8 },
  { name: "Napalm Projector", type: "THERMAL", dmg: "15", tags: "BURN", efek: "Opsional: Apply Burn.", harga: 42000, berat: 7 },
  { name: "Micro Missile Rack", type: "THERMAL", dmg: "17", tags: "EXPLOSIVE/VOLLEY", efek: "+1d6 jika target LIGHT armor.", harga: 48000, berat: 6 },
  { name: "EMP Rifle", type: "ENERGY", dmg: "12", tags: "SHOCK/CONTROL", efek: "Apply Shock: target tidak bisa rotate 1 turn.", harga: 30000, berat: 3 },
  { name: "Plasma Gun", type: "ENERGY", dmg: "16", tags: "ARMOR-BREAK", efek: "+1d6 vs armor Damaged/Broken.", harga: 38000, berat: 4 },
  { name: "Electro Lance", type: "ENERGY", dmg: "17", tags: "PRECISION/WEAK-SPEC", efek: "+1d6 weak spot bawaan. Stack dengan global weak spot.", harga: 40000, berat: 5 },
  { name: "Ion Blaster", type: "ENERGY", dmg: "14", tags: "DISRUPT", efek: "Reduce DEF target by 1 selama 1 turn.", harga: 28000, berat: 3 },
  { name: "Arc Projector", type: "ENERGY", dmg: "15", tags: "CHAIN/CONTROL", efek: "Jika target HEAVY: +1d6 dan Apply Shock.", harga: 42000, berat: 5 },
  { name: "Pulse Cutter", type: "ENERGY", dmg: "18", tags: "CLOSE/SYSTEM-BREAK", efek: "+1d6 jika target sedang Shock atau Exposed.", harga: 46000, berat: 5 },
  { name: "Hydraulic Grapple Arms", type: "CR/GRAPPLE", dmg: "1d4", tags: "GRAPPLE", efek: "Grapple DC 12. Target tertahan, 1d4 dmg/ronde.", harga: 50000, berat: 6 },
  { name: "Extendable Claws", type: "CR/GRAPPLE", dmg: "1d6", tags: "GRAPPLE/PIERCE", efek: "Grapple DC 14. +2 dmg jika target gagal Escape.", harga: 100000, berat: 6 },
];

const ARMORS = [
  { name: "EMPTY", type: "—", defBonus: 0, moveBonus: 0, efek: "—", harga: 0, berat: 0 },
  { name: "LIGHT — Frame Mk.I", type: "LIGHT", defBonus: 1, moveBonus: 1, efek: "Frame ringan generasi awal.", harga: 0, berat: 1 },
  { name: "LIGHT — Frame Mk.II", type: "LIGHT", defBonus: 1, moveBonus: 2, efek: "Pengembangan untuk pilot pengintai.", harga: 0, berat: 1 },
  { name: "LIGHT — Recon Frame", type: "LIGHT", defBonus: 1, moveBonus: 1, efek: "Saat weak spot: +1 MOVE sebelum/sesudah aksi.", harga: 0, berat: 1 },
  { name: "LIGHT — Heat Shield Plating", type: "LIGHT", defBonus: 1, moveBonus: 0, efek: "1×/encounter: kurangi 1d6 bonus THERMAL counter.", harga: 0, berat: 2 },
  { name: "MEDIUM — Frame Mk.I", type: "MEDIUM", defBonus: 2, moveBonus: 0, efek: "Standar paling umum, seimbang.", harga: 0, berat: 2 },
  { name: "MEDIUM — Frame Mk.II", type: "MEDIUM", defBonus: 2, moveBonus: 0, efek: "+1 vs Kinetic pertama tiap ronde.", harga: 0, berat: 2 },
  { name: "MEDIUM — Adaptive Frame", type: "MEDIUM", defBonus: 2, moveBonus: 0, efek: "GM boleh beri +1 situasional.", harga: 0, berat: 2 },
  { name: "MEDIUM — Field Utility Shell", type: "MEDIUM", defBonus: 2, moveBonus: 0, efek: "Aksi support lebih aman naratif.", harga: 0, berat: 2 },
  { name: "MEDIUM — Insulated Armor", type: "MEDIUM", defBonus: 2, moveBonus: 0, efek: "1×/encounter: abaikan Shock pertama.", harga: 0, berat: 2 },
  { name: "HEAVY — Frame Mk.I", type: "HEAVY", defBonus: 3, moveBonus: -1, efek: "Frame berat garis depan.", harga: 0, berat: 3 },
  { name: "HEAVY — Frame Mk.II", type: "HEAVY", defBonus: 4, moveBonus: -2, efek: "Versi diperkuat tank.", harga: 0, berat: 4 },
  { name: "HEAVY — Reactive Plating", type: "HEAVY", defBonus: 3, moveBonus: -1, efek: "−2 dmg dari Kinetic pertama tiap ronde.", harga: 0, berat: 3 },
  { name: "HEAVY — Bulwark Frame", type: "HEAVY", defBonus: 3, moveBonus: -1, efek: "Reduce semua dmg by 2.", harga: 0, berat: 4 },
  { name: "HEAVY — Siege Mantle", type: "HEAVY", defBonus: 4, moveBonus: 0, efek: "Tidak dapat bonus MOVE dari armor.", harga: 0, berat: 5 },
];

const LEGS = [
  { name: "EMPTY", defBonus: 0, moveBonus: 0, efek: "—", harga: 0, berat: 0 },
  { name: "Basic Legs", defBonus: 2, moveBonus: 4, efek: "Standar. GRATIS untuk starter.", harga: 0, berat: 6 },
  { name: "Agile Pistons", defBonus: 3, moveBonus: 3, efek: "Balance DEF dan MOVE.", harga: 110000, berat: 4 },
  { name: "Stealth Walkers", defBonus: 2, moveBonus: 5, efek: "+2 DEF tambahan di terrain hutan.", harga: 115000, berat: 5 },
  { name: "Swift Striders", defBonus: 1, moveBonus: 6, efek: "Prioritas kecepatan.", harga: 120000, berat: 4 },
  { name: "Heavy Treads", defBonus: 4, moveBonus: 3, efek: "Kebal efek terrain lumpur/rough.", harga: 120000, berat: 8 },
  { name: "Reinforced Limbs", defBonus: 6, moveBonus: 2, efek: "Prioritas pertahanan maksimum.", harga: 130000, berat: 8 },
  { name: "Air Gliders", defBonus: 4, moveBonus: 4, efek: "Kebal semua efek terrain.", harga: 145000, berat: 4 },
];

const THRUSTERS = [
  { name: "EMPTY", moveBonus: 0, efek: "—", harga: 0, berat: 0 },
  { name: "Jet Stream", moveBonus: 2, efek: "Thruster standar.", harga: 28000, berat: 2 },
  { name: "Turbo Boost", moveBonus: 3, efek: "Peningkatan kecepatan signifikan.", harga: 35000, berat: 3 },
  { name: "Sonic Surge", moveBonus: 4, efek: "Burst +4m movement 1×/misi.", harga: 48000, berat: 4 },
  { name: "Velocity Vortex", moveBonus: 5, efek: "Bypass rintangan terrain.", harga: 72000, berat: 5 },
  { name: "Mach Momentum", moveBonus: 6, efek: "Momentum: +1d4 dmg saat charge.", harga: 110000, berat: 6 },
  { name: "Hyper Drive", moveBonus: 7, efek: "Dash-teleport 10m 1×/misi.", harga: 145000, berat: 7 },
];

const ACCESSORIES = [
  { name: "EMPTY", tipe: "—", efek: "—", harga: 0, berat: 0 },
  { name: "Reactive Plating", tipe: "Reactive Ceramic", efek: "DEF +3 selama 1 ronde saat terima damage >10.", harga: 25000, berat: 2 },
  { name: "Shock Absorbers", tipe: "Impact Dissipators", efek: "React: batalkan efek Knockback.", harga: 25000, berat: 2 },
  { name: "Thermal Insulation", tipe: "Heat Dispersal", efek: "React (2×/misi): batalkan efek Burn.", harga: 25000, berat: 2 },
  { name: "Electric Discharge", tipe: "Capacitive Discharge", efek: "React (2×/misi): batalkan efek Shock/Stun.", harga: 25000, berat: 2 },
  { name: "Chemical Neutralization", tipe: "Reactive Nanofluid", efek: "React (2×/misi): batalkan efek Corrosive.", harga: 25000, berat: 2 },
  { name: "Smoke Grenade Launcher", tipe: "Defense Utility", efek: "React: EVA +2, halangi pandangan musuh 1 ronde.", harga: 3000, berat: 1 },
  { name: "Chaff Dispenser", tipe: "Anti-Missile", efek: "React: DEF +3 vs serangan missile.", harga: 4000, berat: 2 },
  { name: "ECM Jammer", tipe: "Electronic Warfare", efek: "Stun sistem elektronik radius 15m, 1×/misi.", harga: 40000, berat: 1 },
  { name: "Anti-Radar Coating", tipe: "Stealth", efek: "Invisible 3 ronde, 1×/misi.", harga: 45000, berat: 1 },
  { name: "EMP Grenade", tipe: "EMP Pulse", efek: "Stun 1 ronde radius 10m, 1×/misi.", harga: 60000, berat: 1 },
  { name: "Fragmentation Grenade", tipe: "Grenade", efek: "3d6 piercing radius 5m, 2×/misi.", harga: 45000, berat: 0 },
  { name: "Medical Kit", tipe: "Medical", efek: "Stabilkan pilot INJURED, pulihkan 1d10 HP organik, 2×/misi.", harga: 5000, berat: 0 },
  { name: "Toolbox", tipe: "Utility", efek: "Perbaikan darurat SCAR +1d8 HP, 2×/misi.", harga: 8000, berat: 0 },
  { name: "Sensor Termal", tipe: "System Sensor", efek: "Night vision aktif. Deteksi panas di balik tembok.", harga: 30000, berat: 0 },
  { name: "Lidar", tipe: "System Sensor", efek: "Target sulit bersembunyi: +1 bonus hit rate.", harga: 30000, berat: 0 },
  { name: "Omegitium Core Lining", tipe: "Permanent", efek: "Immune Grey Plague exposure dalam SCAR. T1+ only.", harga: 300000, berat: 2 },
  { name: "Neural Link", tipe: "Permanent", efek: "Semua serangan: target −1 DEF threshold permanen. T2+ only.", harga: 400000, berat: 1 },
  { name: "Salvage System", tipe: "Permanent", efek: "Auto-collect 1 Loot setelah kalahkan Golem.", harga: 120000, berat: 2 },
  { name: "Hydraulic Overdrive", tipe: "Permanent", efek: "MOVE +3 permanent + dash 8m 1×/misi. Med/Light only.", harga: 60000, berat: 2 },
];

const ITEMS = [
  { name: "EMPTY", efek: "—", harga: 0, keterangan: "Slot kosong." },
  { name: "Omegitium Shard", efek: "Material", harga: 0, keterangan: "Material crafting — 1 Shard." },
  { name: "Scrap Metal", efek: "Material", harga: 0, keterangan: "Material crafting — 1 Scrap." },
  { name: "Electronic Parts", efek: "Material", harga: 0, keterangan: "Material crafting — 1 Elec." },
  { name: "Bio-Gel", efek: "Material", harga: 0, keterangan: "Material crafting — 1 Bio-Gel." },
  { name: "Fusion Cell", efek: "Material", harga: 0, keterangan: "Material crafting — 1 Fusion Cell." },
  { name: "O-Blockers Standard", efek: "Reduce Plague 50%", harga: 5600, keterangan: "Obat radiasi 7 hari. $800/hari." },
  { name: "O-Blockers Premium", efek: "Immune Plague 100%", harga: 8400, keterangan: "Obat radiasi premium 7 hari." },
  { name: "Ransum (7 hari)", efek: "Cegah HUNGER", harga: 3500, keterangan: "Ransum harian 7 hari." },
  { name: "Medical Kit", efek: "Stabilkan + 1d10 HP", harga: 15000, keterangan: "Pertolongan pertama darurat." },
  { name: "Stim Pack", efek: "Cegah Exhaustion", harga: 0, keterangan: "Crafting: 1 Bio-Gel + 1 Fusion, DC 13." },
  { name: "Repair Kit Darurat", efek: "Repair 2d8 HP SCAR", harga: 0, keterangan: "Crafting: 2 Scrap + 1 Elec, DC 12." },
  { name: "Omegitium Grenade", efek: "2d6+1d4 radius 5m", harga: 0, keterangan: "Crafting: 2 Shard + 1 Fusion, DC 14." },
  { name: "Portable Shield", efek: "DEF +3 (1 ronde)", harga: 0, keterangan: "Crafting: 3 Scrap + 2 Elec, DC 14." },
  { name: "Thermal Goggles", efek: "Night vision", harga: 0, keterangan: "Crafting: 1 Elec + 1 Shard, DC 15." },
  { name: "EMP Bomb DIY", efek: "Stun radius 5m", harga: 0, keterangan: "Crafting: 2 Elec + 1 Shard, DC 16." },
  { name: "Plague Sample", efek: "Cure ALL Plague", harga: 0, keterangan: "Drop Crystal Herald." },
  { name: "Abyssal Core", efek: "Material unik", harga: 0, keterangan: "Drop Abyssal Golem." },
  { name: "Sovereign Core", efek: "Material unik", harga: 0, keterangan: "Drop Golem Sovereign." },
  { name: "Flashdrive Organik", efek: "Plot hook", harga: 0, keterangan: "Drop Pilot-Fused Golem." },
];

const PLAGUE_STAGES = [
  { min: 0, max: 0, label: "INKUBASI", desc: "Tidak ada efek", color: "#4a6048" },
  { min: 1, max: 10, label: "PAPARAN", desc: "−1 semua roll per 5 stack", color: "#ca8a04" },
  { min: 11, max: 25, label: "INFEKSI", desc: "−2 DEF, −1 MOVE per ronde", color: "#ea580c" },
  { min: 26, max: 40, label: "KRITIS", desc: "Death Save tiap ronde", color: "#dc2626" },
  { min: 41, max: 999, label: "TERMINAL", desc: "Pilot dalam hitungan jam", color: "#7f1d1d" },
];

const typeColor = { KINETIC: "#94a3b8", THERMAL: "#f97316", ENERGY: "#38bdf8", "CR/GRAPPLE": "#a78bfa" };
const PILOT_STATUS = ["INJURED", "HUNGER", "EXHAUST", "COLD"];

// Hunger levels: 0 = Fed, 1-4 = escalating Hunger, 5 = Starving
const HUNGER_LEVELS = [
  { label: "FED", color: "#22c55e", desc: "Pilot kenyang. Tidak ada efek." },
  { label: "L1", color: "#84cc16", desc: "Lapar ringan. Tidak ada efek mekanik." },
  { label: "L2", color: "#eab308", desc: "Lapar. -1 semua roll skill non-combat." },
  { label: "L3", color: "#f59e0b", desc: "Sangat lapar. -1 semua roll. -1 DEF." },
  { label: "L4", color: "#ea580c", desc: "Kelaparan. -2 semua roll. Exhaust otomatis." },
  { label: "L5", color: "#dc2626", desc: "STARVING. HP organik -1/ronde. Kritis." },
];

const FACTION_LIST = [
  { key: "PU", name: "Pacific Union", color: "#3b82f6" },
  { key: "AR", name: "Aresian Republic", color: "#dc2626" },
  { key: "SAU", name: "Saudi-UAE", color: "#f59e0b" },
  { key: "OCE", name: "Oceanian Federation", color: "#06b6d4" },
  { key: "MEC", name: "Mercenary Coalition", color: "#a855f7" },
  { key: "ATL", name: "Atlantic Remnant", color: "#94a3b8" },
];

const WOUND_OPTIONS = [
  "Prosthetic left arm", "Prosthetic right arm",
  "Prosthetic left leg", "Prosthetic right leg",
  "Cybernetic eye (left)", "Cybernetic eye (right)",
  "Lung implant", "Spine reinforcement",
  "Nerve damage (chronic pain)", "Grey Plague scarring",
  "Burn scars (thermal)", "PTSD (combat trauma)",
];

// ============================================================
// NPC POOL — lazy-loaded from Supabase, demo pool embedded
// ============================================================
//
// File ringan: pool penuh (280 NPC) disimpan di Supabase table
// `warbound_npc_pool`. Demo mode pakai pool kecil ini saja.
// GM bisa juga bikin Custom NPC yang tersimpan di `warbound_npcs`.

const NPC_HIGHLIGHT_POOL = [{"id":"TIPE_01_V01","name":"Penduduk Kumuh Core Sump","arketype":"Non-Combatant / Sipil","lokasi":"The Core Sump","fraksi":"Pacific Union","hp":8,"def":0,"move":"6m","ap":0,"weapon":"Machete","damage":"1d4","special":"Tidak bisa diserang tanpa penalti Moralitas.","notes":"Melarikan diri jika ada kesempatan. Bisa jadi informan.","tier":0,"chassis":"Tanpa SCAR"},{"id":"TIPE_02_V05","name":"Satpam Korporat Level Rendah","arketype":"Operator Utilitas","lokasi":"Neo-Jakarta","fraksi":"Pacific Union","hp":55,"def":9,"move":"10m","ap":0,"weapon":"Mace + Stun Baton","damage":"1d8+Stun","special":"Prone Attack: Mace Hit → DC 12 VIT atau target Prone.","notes":"Prone Attack + efek Stun 1 turn jika damage >10.","tier":0,"chassis":"SCAR Medium Sipil"},{"id":"TIPE_03_V01","name":"Pasukan Patroli SAU","arketype":"Grunt Garis Depan","lokasi":"Red Zone Siberia","fraksi":"SAU","hp":80,"def":12,"move":"8m","ap":0,"weapon":"Rifle Standar","damage":"1d8","special":"Cover Formation: 2+ Grunt berdampingan → Cover (+2 DEF) tanpa objek fisik.","notes":"Cover Formation. Memanggil bala bantuan jika 1 anggota mati.","tier":0,"chassis":"SCAR Heavy Standar"},{"id":"TIPE_04_V01","name":"Pemburu Bayaran Independen","arketype":"Striker Agresif","lokasi":"Berbagai","fraksi":"Netral","hp":45,"def":7,"move":"18m","ap":0,"weapon":"Sniper Rifle","damage":"1d8","special":"Hit & Run: setelah menyerang, bergerak hingga Move maksimum tanpa memicu Overwatch.","notes":"Hit & Run. +2 Acc jika tidak bergerak. Prioritas target: Medis pemain.","tier":1,"chassis":"SCAR Light"},{"id":"TIPE_05_V01","name":"Saboteur Children of Blue Flame","arketype":"Teknisi / Hacker","lokasi":"Grey Zones","fraksi":"Blue Flame","hp":42,"def":6,"move":"16m","ap":0,"weapon":"Ion Gun","damage":"1d4","special":"System Disrupt: 1x/encounter, disable 1 modul SCAR pemain 2 ronde (DC 16 INT resist).","notes":"System Disrupt. Prioritas: merusak O-Blockers atau sistem radiasi SCAR.","tier":1,"chassis":"SCAR Light"},{"id":"TIPE_06_V01","name":"Medis Lapangan SAU","arketype":"Medis Lapangan","lokasi":"Red Zone Siberia","fraksi":"SAU","hp":58,"def":9,"move":"12m","ap":0,"weapon":"Rifle Ringan","damage":"1d6","special":"Field Patch: setiap ronde Bonus Action, pulihkan 1d6 HP ke 1 unit musuh yang terlihat.","notes":"Field Patch. Memprioritaskan Grunt dan Komandan. Mundur ke belakang garis.","tier":1,"chassis":"SCAR Medium"},{"id":"TIPE_07_V01","name":"Sniper SAU Terlatih","arketype":"Penembak Jitu / Overwatch","lokasi":"Bukit Siberia","fraksi":"SAU","hp":42,"def":6,"move":"16m","ap":0,"weapon":"Sniper Rifle","damage":"1d8+2Acc","special":"Overwatch: tidak bergerak, tapi +3 Accuracy dan menembak pertama pada siapapun yang melintas di LoS.","notes":"Overwatch. +2 Acc bonus tambahan jika diam. Posisi: selalu ketinggian.","tier":1,"chassis":"SCAR Light"},{"id":"TIPE_08_V01","name":"Artileri Reguler SAU","arketype":"Artileri Berat","lokasi":"Garis Belakang","fraksi":"SAU","hp":85,"def":11,"move":"6m","ap":0,"weapon":"Howitzer","damage":"2d8+2 R20m","special":"Suppression Fire: radius 15m, pemain harus roll AGI DC 13 atau kehilangan Cover bonus.","notes":"Suppression. Reload 2 turn. Selalu di belakang Grunt.","tier":1,"chassis":"SCAR Heavy Artileri"},{"id":"TIPE_09_V01","name":"Kolonel SAU Lapangan","arketype":"Komandan Lapangan","lokasi":"Fasilitas SAU","fraksi":"SAU","hp":92,"def":15,"move":"8m","ap":1,"weapon":"Cannon","damage":"2d8","special":"Command Aura: unit musuh dalam 15m mendapat +1 Accuracy dan tidak flee saat HP <30%.","notes":"Command Aura. Jika mati: semua Grunt dalam 20m fleeing.","tier":2,"chassis":"SCAR Heavy Tier 1"},{"id":"TIPE_10_V01","name":"Bodyguard Spire Corp","arketype":"Bodyguard Elite","lokasi":"Upper Spire","fraksi":"Pacific Union","hp":95,"def":18,"move":"7m","ap":2,"weapon":"Mace Hydraulic","damage":"1d8+Prone","special":"Shield Protocol: jika VIP diserang, Bodyguard mengintervensi - ambil alih damage (1x/ronde).","notes":"Shield Protocol. Nanotech Defense: regen 1 HP/turn.","tier":2,"chassis":"SCAR Heavy Tier 1"},{"id":"TIPE_11_V01","name":"Broker Pasar Gelap Neo-Jakarta","arketype":"Negosiator / Broker","lokasi":"Core Sump","fraksi":"Independen","hp":12,"def":1,"move":"5m","ap":0,"weapon":"Pistol","damage":"1d4","special":"Price Floor: pemain tidak bisa menawar di bawah 70% harga awal tanpa roll INT DC 16.","notes":"Price Floor. Tahu lokasi 1 cache senjata khusus. Biaya informasi: $15k.","tier":0,"chassis":"Tanpa SCAR"},{"id":"TIPE_13_V01","name":"Veteran SAU Desertir","arketype":"Veteran Bertempur","lokasi":"The Scorch","fraksi":"Independen","hp":105,"def":16,"move":"10m","ap":2,"weapon":"Gatling + Axe","damage":"3d6/1d10","special":"Battle-Hardened: immune Stun dan Knockback. Setiap kali HP turun 25%, mendapat +1 Accuracy permanen hingga akhir combat.","notes":"Battle-Hardened. Tahu taktik SAU - bisa dieksploitasi sebagai informan.","tier":2,"chassis":"SCAR Heavy/Medium Tier 2"},{"id":"TIPE_14_V01","name":"Ace SAU Desertir","arketype":"Pilot Ace","lokasi":"Berbagai","fraksi":"Independen","hp":65,"def":10,"move":"20m","ap":1,"weapon":"Sniper","damage":"1d8+2Acc","special":"Ghost Protocol T2: saat bergerak >50% Move, SETIAP serangan terhadapnya butuh roll Accuracy tambahan DC 16.","notes":"Ghost Protocol T2. Prioritas target: Programer dan Mekanik pemain.","tier":2,"chassis":"SCAR Light Tier 2"}];

// Cache: fetched pool + custom NPC, reused across renders
let _npcPoolCache = null;
let _customNpcCache = null;

async function fetchNpcPool(supabase) {
  if (_npcPoolCache) return _npcPoolCache;
  if (!supabase) return NPC_HIGHLIGHT_POOL;
  try {
    const { data, error } = await supabase.from("warbound_npc_pool").select("*").order("id_varian");
    if (error) throw error;
    if (!data || data.length === 0) {
      // table kosong — GM belum seed, fallback ke highlight pool
      return NPC_HIGHLIGHT_POOL;
    }
    _npcPoolCache = data.map(r => r.data);
    return _npcPoolCache;
  } catch (e) {
    console.warn("NPC pool fetch failed, using highlight pool:", e.message);
    return NPC_HIGHLIGHT_POOL;
  }
}

async function fetchCustomNpcs(supabase, userId) {
  if (!supabase || !userId) return [];
  if (_customNpcCache) return _customNpcCache;
  try {
    const { data, error } = await supabase.from("warbound_npcs").select("*").eq("created_by", userId).order("created_at", { ascending: false });
    if (error) throw error;
    _customNpcCache = (data || []).map(r => ({ ...r.data, __custom: true, __row_id: r.id }));
    return _customNpcCache;
  } catch (e) { return []; }
}

function invalidateNpcCaches() { _npcPoolCache = null; _customNpcCache = null; }

const QUICK_ROLL_TABLES = [
  { name: "AMBUSH STANDAR", icon: "⚔", entries: [
    { range: "1-5", rec: "TIPE_03_V01–V05", desc: "Grunt SAU / Pacific Union", count: "3-5 unit", note: "Cover Formation aktif jika 2+ unit berdampingan." },
    { range: "6-10", rec: "TIPE_04_V01–V05", desc: "Striker Agresif campuran", count: "2 unit flanker", note: "Hit & Run — jangan biarkan mereka diam di posisi." },
    { range: "11-15", rec: "TIPE_03 + TIPE_07", desc: "Grunt + Sniper di belakang", count: "3 Grunt + 1 Sniper", note: "Sniper di ketinggian — DC 17 untuk deteksi posisi." },
    { range: "16-20", rec: "TIPE_09 + TIPE_03", desc: "Komandan + Escort Grunt", count: "1 Komandan + 4 Grunt", note: "Command Aura aktif. Prioritas: bunuh Komandan dulu." },
  ]},
  { name: "INFILTRASI / STEALTH", icon: "◈", entries: [
    { range: "1-5", rec: "TIPE_01_V03–V07", desc: "Staf korporat / penjaga sipil", count: "2-3 unit", note: "Tidak bisa diserang tanpa penalti Moralitas." },
    { range: "6-10", rec: "TIPE_02_V04–V10", desc: "Operator utilitas bersenjata", count: "2 unit patroli", note: "Prone Attack jika berhasil hit." },
    { range: "11-15", rec: "TIPE_05_V01–V05", desc: "Teknisi Hacker + alarm", count: "1 Hacker + sistem alarm", note: "System Disrupt jika tidak dihentikan dalam 2 ronde." },
    { range: "16-20", rec: "TIPE_12_V01–V05", desc: "Informan + jaringan mata-mata", count: "Encounter sosial", note: "Burn Identity — satu info palsu sebelum ekspos." },
  ]},
  { name: "ENCOUNTER SOSIAL", icon: "◆", entries: [
    { range: "1-5", rec: "TIPE_11_V01–V10", desc: "Broker / Negosiator", count: "Encounter damai", note: "Price Floor DC 16. Bawa uang atau leverage." },
    { range: "6-10", rec: "TIPE_12_V01–V10", desc: "Informan / Mata-Mata", count: "Encounter investigasi", note: "Perlu DC INT untuk mengidentifikasi agen." },
    { range: "11-15", rec: "TIPE_11 + TIPE_10_V02", desc: "Broker + Bodyguard", count: "Negosiasi + penjaga", note: "Shield Protocol aktif jika Broker diserang." },
    { range: "16-20", rec: "TIPE_01_V11–V15", desc: "NPC sipil penting", count: "Encounter moral", note: "Penalti Moralitas jika diserang. Plot hook." },
  ]},
  { name: "MINI-BOSS ENCOUNTER", icon: "☠", entries: [
    { range: "1-5", rec: "TIPE_13_V01–V05", desc: "Veteran Bertempur solo", count: "1 unit", note: "Battle-Hardened. Immune Stun dan Knockback." },
    { range: "6-10", rec: "TIPE_14_V01–V05", desc: "Pilot Ace solo", count: "1 unit mobile", note: "Ghost Protocol T2 aktif saat bergerak >50% Move." },
    { range: "11-15", rec: "TIPE_13 + TIPE_06", desc: "Veteran + Medis Support", count: "1 Veteran + 1 Medis", note: "Field Patch setiap ronde. Bunuh Medis dulu." },
    { range: "16-20", rec: "TIPE_09 + TIPE_10", desc: "Komandan + Bodyguard", count: "Double boss", note: "Command Aura + Shield Protocol. Encounter berat." },
  ]},
  { name: "THE SCORCH / GREY ZONES", icon: "☣", entries: [
    { range: "1-5", rec: "TIPE_01_V01–V03", desc: "Penduduk kumuh / pemulung", count: "3-6 unit", note: "Tidak bisa diserang tanpa penalti Moralitas." },
    { range: "6-10", rec: "TIPE_02_V03–V09", desc: "Operator berongsokan", count: "2-3 unit", note: "Prone Attack. Sering membawa Scrap Metal." },
    { range: "11-15", rec: "TIPE_04_V05 + V10", desc: "Raider + Sniper rongsokan", count: "1 Raider + 1 Sniper", note: "Hit & Run. Sniper berpindah tiap 2 ronde." },
    { range: "16-20", rec: "TIPE_13_V11 + V13", desc: "Warchief + Berserker", count: "Mini-boss The Scorch", note: "Dual-wield Axe. Jika kalah: klan menjadi ally." },
  ]},
  { name: "BLUE FLAME / KULTUS", icon: "✦", entries: [
    { range: "1-5", rec: "TIPE_01_V11", desc: "Anggota Kultus Pasif", count: "4-6 unit", note: "Grey Plague Tahap 1. Info tentang Azrael." },
    { range: "6-10", rec: "TIPE_03_V20 + TIPE_04_V03", desc: "Garda + Asasin Blue Flame", count: "3 Grunt + 1 Asasin", note: "Garda meledak Plague saat mati. Asasin Grapple." },
    { range: "11-15", rec: "TIPE_05_V06 + TIPE_08_V03", desc: "Hacker + Artileri Kristal", count: "Sabotase + Suppression", note: "System Disrupt + Burn area. Sangat berbahaya." },
    { range: "16-20", rec: "TIPE_09_V07 + TIPE_13_V17", desc: "Brother Lieutenant + Iron Pilgrim", count: "Mini-boss kultus", note: "Command Aura Plague + dual-wield Plague Tahap 2." },
  ]},
];

// ============================================================
// SUPABASE CLIENT (lazy-loaded from CDN)
// ============================================================

let supabaseInstance = null;
async function getSupabase(url, key) {
  if (supabaseInstance) return supabaseInstance;
  if (!window.supabaseJs) {
    const mod = await import("https://esm.sh/@supabase/supabase-js@2");
    window.supabaseJs = mod;
  }
  supabaseInstance = window.supabaseJs.createClient(url, key);
  return supabaseInstance;
}

// ============================================================
// IMAGE UPLOAD — client-side compression + Supabase Storage
// ============================================================

const MAX_SIZES = {
  portrait: 1 * 1024 * 1024,   // 1 MB
  mech: 2 * 1024 * 1024,       // 2 MB
};
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Simple canvas-based compressor — downscales to maxW/maxH & compresses to webp
async function compressImage(file, { maxW = 800, maxH = 800, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error("Compression failed")), "image/webp", quality);
    };
    img.onerror = () => reject(new Error("Invalid image"));
    img.src = URL.createObjectURL(file);
  });
}

async function uploadToSupabase(supabase, userId, slot, file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format tidak didukung. Pakai JPG, PNG, atau WEBP.");
  }
  const max = MAX_SIZES[slot] || MAX_SIZES.portrait;
  if (file.size > max * 2.5) { // allow larger input, we'll compress
    throw new Error(`File terlalu besar (${(file.size/1024/1024).toFixed(1)}MB). Max input ~${(max*2.5/1024/1024).toFixed(1)}MB.`);
  }
  const dims = slot === "mech" ? { maxW: 900, maxH: 900, quality: 0.85 } : { maxW: 600, maxH: 600, quality: 0.88 };
  const blob = await compressImage(file, dims);
  if (blob.size > max) throw new Error(`Setelah kompresi masih >${(max/1024/1024).toFixed(1)}MB.`);
  const path = `${userId}/${slot}-${Date.now()}.webp`;
  const { error } = await supabase.storage.from("warbound-assets").upload(path, blob, { contentType: "image/webp", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("warbound-assets").getPublicUrl(path);
  return data.publicUrl;
}


// ============================================================
// SHARED STYLES
// ============================================================

const PALETTE = {
  bg: "#060809",
  surface: "#0a0e10",
  surface2: "#0d1117",
  border: "#1a2018",
  borderAlt: "#1c2820",
  accent: "#d97706",
  accentDim: "#92530a",
  text: "#c9d4c7",
  textBright: "#e8f5e0",
  dim: "#3a4a38",
  dim2: "#5a6a58",
  hpGreen: "#22c55e",
  hpAmber: "#f59e0b",
  hpRed: "#dc2626",
  def: "#60a5fa",
  move: "#c084fc",
  danger: "#dc2626",
};

const btnStyle = { background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, color: "#8a9a88", width: 26, height: 26, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", flexShrink: 0, borderRadius: 2 };
const inputStyle = { background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, color: PALETTE.text, padding: "6px 8px", fontFamily: "'Share Tech Mono','Courier New',monospace", fontSize: 11, width: "100%", outline: "none", borderRadius: 2 };
const selectStyle = { ...inputStyle, cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23d97706'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 24 };
const labelStyle = { fontSize: 8, color: PALETTE.dim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 };
const boxStyle = { background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, padding: 10, borderRadius: 2 };

// ============================================================
// LITTLE COMPONENTS
// ============================================================

function HeaderStatCell({ label, value, color = PALETTE.textBright, sub, accent }) {
  return (
    <div style={{ flex: 1, borderLeft: `1px solid ${PALETTE.borderAlt}`, padding: "8px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 58, position: "relative" }}>
      {accent && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: PALETTE.accent }} />}
      <div style={{ fontSize: 8, color: PALETTE.dim, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 20, fontFamily: "'Orbitron',sans-serif", color, lineHeight: 1, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 8, color: PALETTE.dim2, marginTop: 2, letterSpacing: 1 }}>{sub}</div>}
    </div>
  );
}

function SectionLabel({ children, accent = true }) {
  return (
    <div style={{ fontSize: 9, color: accent ? PALETTE.accent : PALETTE.text, letterSpacing: 3, textTransform: "uppercase", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 12, height: 1, background: accent ? PALETTE.accent : PALETTE.dim }} />
      {children}
    </div>
  );
}

function HpBar({ current, max, color }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div style={{ background: PALETTE.surface2, height: 6, width: "100%", overflow: "hidden", border: `1px solid ${PALETTE.borderAlt}`, borderRadius: 1 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.3s ease, background 0.3s" }} />
    </div>
  );
}

function Spinner({ value, setValue, min = 0, max = 9999, step = 1 }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      <button onClick={() => setValue(Math.max(min, value - step))} style={btnStyle}>−</button>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: PALETTE.textBright, minWidth: 36, textAlign: "center", lineHeight: 1, fontWeight: 700 }}>{value}</div>
      <button onClick={() => setValue(Math.min(max, value + step))} style={btnStyle}>+</button>
    </div>
  );
}

// ============================================================
// MECH SVG ILLUSTRATIONS (simple but evocative)
// ============================================================

function MechSvg({ chassis }) {
  const common = { stroke: PALETTE.text, fill: "none", strokeWidth: 1.5, strokeLinejoin: "round" };
  if (chassis === "HEAVY") {
    return (
      <svg viewBox="0 0 200 260" style={{ width: "100%", height: "100%", maxHeight: 340 }}>
        {/* head */}
        <rect x="80" y="30" width="40" height="24" {...common} />
        <rect x="85" y="36" width="30" height="6" fill={PALETTE.accent} stroke="none" opacity={0.6} />
        {/* shoulders */}
        <polygon points="55,60 70,55 70,90 50,95" {...common} />
        <polygon points="145,60 130,55 130,90 150,95" {...common} />
        {/* torso */}
        <rect x="70" y="55" width="60" height="85" {...common} />
        <line x1="100" y1="55" x2="100" y2="140" {...common} strokeDasharray="3 3" />
        <rect x="82" y="75" width="36" height="20" {...common} />
        {/* arms / weapons */}
        <rect x="40" y="95" width="18" height="60" {...common} />
        <rect x="35" y="155" width="28" height="40" {...common} />
        <circle cx="49" cy="175" r="5" fill={PALETTE.accent} stroke="none" opacity={0.5} />
        <rect x="142" y="95" width="18" height="60" {...common} />
        <rect x="137" y="155" width="28" height="40" {...common} />
        <circle cx="151" cy="175" r="5" fill={PALETTE.accent} stroke="none" opacity={0.5} />
        {/* hips */}
        <rect x="72" y="140" width="56" height="18" {...common} />
        {/* legs */}
        <rect x="75" y="158" width="22" height="50" {...common} />
        <rect x="103" y="158" width="22" height="50" {...common} />
        <rect x="70" y="208" width="32" height="30" {...common} />
        <rect x="98" y="208" width="32" height="30" {...common} />
        {/* ground */}
        <line x1="30" y1="245" x2="170" y2="245" stroke={PALETTE.dim} strokeWidth={1} />
      </svg>
    );
  }
  if (chassis === "MEDIUM") {
    return (
      <svg viewBox="0 0 200 260" style={{ width: "100%", height: "100%", maxHeight: 340 }}>
        <polygon points="85,30 115,30 118,50 82,50" {...common} />
        <rect x="88" y="36" width="24" height="5" fill={PALETTE.accent} stroke="none" opacity={0.6} />
        <polygon points="60,55 80,52 80,85 55,90" {...common} />
        <polygon points="140,55 120,52 120,85 145,90" {...common} />
        <rect x="80" y="52" width="40" height="75" {...common} />
        <path d="M 80 70 L 120 70 M 80 90 L 120 90" {...common} />
        <rect x="92" y="95" width="16" height="20" {...common} />
        <rect x="55" y="90" width="14" height="50" {...common} />
        <rect x="50" y="140" width="22" height="28" {...common} />
        <rect x="131" y="90" width="14" height="50" {...common} />
        <rect x="128" y="140" width="22" height="28" {...common} />
        <rect x="82" y="127" width="36" height="15" {...common} />
        <polygon points="85,142 95,142 98,200 82,200" {...common} />
        <polygon points="115,142 105,142 102,200 118,200" {...common} />
        <rect x="78" y="200" width="24" height="20" {...common} />
        <rect x="98" y="200" width="24" height="20" {...common} />
        <line x1="30" y1="228" x2="170" y2="228" stroke={PALETTE.dim} strokeWidth={1} />
      </svg>
    );
  }
  // LIGHT
  return (
    <svg viewBox="0 0 200 260" style={{ width: "100%", height: "100%", maxHeight: 340 }}>
      <polygon points="90,32 110,32 115,48 85,48" {...common} />
      <rect x="92" y="38" width="16" height="4" fill={PALETTE.accent} stroke="none" opacity={0.6} />
      <polygon points="75,55 95,52 95,80 72,85" {...common} />
      <polygon points="125,55 105,52 105,80 128,85" {...common} />
      <polygon points="90,52 110,52 114,120 86,120" {...common} />
      <line x1="100" y1="52" x2="100" y2="120" {...common} strokeDasharray="2 3" />
      <rect x="72" y="85" width="10" height="40" {...common} />
      <polygon points="68,125 84,125 80,150 72,150" {...common} />
      <rect x="118" y="85" width="10" height="40" {...common} />
      <polygon points="116,125 132,125 128,150 120,150" {...common} />
      <polygon points="88,120 112,120 115,135 85,135" {...common} />
      <polygon points="88,135 96,135 92,205 82,205" {...common} />
      <polygon points="112,135 104,135 108,205 118,205" {...common} />
      <polygon points="78,205 100,200 98,225 76,225" {...common} />
      <polygon points="122,205 100,200 102,225 124,225" {...common} />
      <line x1="30" y1="232" x2="170" y2="232" stroke={PALETTE.dim} strokeWidth={1} />
    </svg>
  );
}

function PilotSvg({ gender, selected, onClick, label }) {
  const active = selected;
  return (
    <div onClick={onClick} style={{ cursor: "pointer", border: `2px solid ${active ? PALETTE.accent : PALETTE.borderAlt}`, padding: 8, background: active ? "rgba(217,119,6,0.06)" : PALETTE.surface2, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, borderRadius: 2, transition: "all 0.15s" }}>
      <div style={{ fontSize: 9, color: active ? PALETTE.accent : PALETTE.dim2, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{gender === "F" ? "P-01" : "P-02"}</div>
      <svg viewBox="0 0 80 130" style={{ width: "100%", height: 110 }}>
        <g stroke={active ? PALETTE.accent : PALETTE.text} fill="none" strokeWidth={1.2} strokeLinejoin="round">
          {/* helmet */}
          <path d="M 30 15 Q 40 8, 50 15 L 52 32 Q 40 36, 28 32 Z" />
          <rect x="30" y="22" width="20" height="6" fill={active ? PALETTE.accent : PALETTE.dim} opacity={0.6} stroke="none" />
          {/* neck */}
          <rect x="37" y="32" width="6" height="5" />
          {/* shoulders/torso */}
          <path d={gender === "F"
            ? "M 25 40 L 55 40 L 58 62 L 52 85 L 48 95 L 32 95 L 28 85 L 22 62 Z"
            : "M 22 40 L 58 40 L 60 65 L 54 92 L 48 98 L 32 98 L 26 92 L 20 65 Z"} />
          <line x1="40" y1="40" x2="40" y2="95" strokeDasharray="2 2" />
          {/* chest detail */}
          <rect x="35" y="48" width="10" height="6" />
          {/* arms */}
          <path d="M 22 45 L 18 75 L 22 88" />
          <path d="M 58 45 L 62 75 L 58 88" />
          {/* legs */}
          <path d="M 33 95 L 30 125" />
          <path d="M 47 95 L 50 125" />
          {/* boots */}
          <path d="M 28 125 L 36 125 L 36 128 L 28 128 Z" fill={active ? PALETTE.accent : PALETTE.dim} opacity={0.4} />
          <path d="M 48 125 L 56 125 L 56 128 L 48 128 Z" fill={active ? PALETTE.accent : PALETTE.dim} opacity={0.4} />
        </g>
      </svg>
      <div style={{ fontSize: 7, color: active ? PALETTE.accent : PALETTE.dim2, letterSpacing: 1.5, textAlign: "center", lineHeight: 1.2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function Barcode() {
  const bars = [3, 1, 2, 1, 3, 2, 1, 3, 1, 2, 2, 3, 1, 2, 1, 3, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3];
  let x = 0;
  return (
    <svg viewBox="0 0 80 16" style={{ width: 90, height: 18 }}>
      {bars.map((w, i) => {
        const el = <rect key={i} x={x} y={0} width={w * 0.7} height={14} fill={PALETTE.textBright} />;
        x += w * 0.7 + 0.5;
        return el;
      })}
    </svg>
  );
}

// Upload-aware image box — shows SVG fallback if no url, handles click-to-upload
function ImageUpload({ url, onUrlChange, slot, supabase, userId, isDemo, fallback, style, aspectLabel }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const inputId = `up-${slot}-${Math.random().toString(36).slice(2, 7)}`;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setUploading(true);
    try {
      if (isDemo || !supabase || !userId) {
        // Demo mode: convert to data URL (limited, but preview works)
        const compressed = await compressImage(file, slot === "mech" ? { maxW: 700, maxH: 700, quality: 0.8 } : { maxW: 500, maxH: 500, quality: 0.85 });
        const reader = new FileReader();
        reader.onload = () => { onUrlChange(reader.result); setUploading(false); };
        reader.readAsDataURL(compressed);
        return;
      }
      const publicUrl = await uploadToSupabase(supabase, userId, slot, file);
      onUrlChange(publicUrl);
    } catch (ex) {
      setErr(ex.message || "Upload gagal");
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div style={{ position: "relative", ...style }}>
      {url ? (
        <img src={url} alt={slot} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", border: `1px solid ${PALETTE.borderAlt}`, borderRadius: 2 }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${PALETTE.borderAlt}`, borderRadius: 2, background: PALETTE.surface2 }}>
          {fallback}
        </div>
      )}
      <label htmlFor={inputId} style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.75)", border: `1px solid ${PALETTE.accent}`, color: PALETTE.accent, padding: "3px 7px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, cursor: uploading ? "wait" : "pointer", fontSize: 8, borderRadius: 2, fontWeight: 700 }}>
        {uploading ? "···" : (url ? "↻" : "↑")} {aspectLabel || "UPLOAD"}
      </label>
      <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} style={{ display: "none" }} />
      {url && (
        <button onClick={() => onUrlChange("")} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.75)", border: `1px solid ${PALETTE.danger}`, color: PALETTE.danger, width: 20, height: 20, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>✕</button>
      )}
      {err && <div style={{ position: "absolute", bottom: -18, left: 0, right: 0, fontSize: 8, color: PALETTE.danger, letterSpacing: 1 }}>✕ {err}</div>}
    </div>
  );
}

// Hunger level bar — 6 segments, click to set level
function HungerBar({ level, onChange }) {
  const current = HUNGER_LEVELS[level] || HUNGER_LEVELS[0];
  return (
    <div style={boxStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ ...labelStyle, margin: 0 }}>HUNGER LEVEL</span>
        <span style={{ fontSize: 10, color: current.color, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{current.label}</span>
      </div>
      <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
        {HUNGER_LEVELS.map((lv, i) => (
          <div key={i} onClick={() => onChange(i)} style={{ flex: 1, height: 14, background: i <= level ? lv.color : PALETTE.surface2, border: `1px solid ${i === level ? lv.color : PALETTE.borderAlt}`, cursor: "pointer", borderRadius: 1, transition: "all 0.15s", opacity: i <= level ? 1 : 0.4 }} title={lv.label} />
        ))}
      </div>
      <div style={{ fontSize: 9, color: PALETTE.dim2, lineHeight: 1.4 }}>{current.desc}</div>
    </div>
  );
}

// Reputation sliders per faction
function ReputationMeter({ reputation, onChange }) {
  return (
    <div style={boxStyle}>
      <SectionLabel>REPUTATION · FACTIONS</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {FACTION_LIST.map(f => {
          const v = reputation[f.key] ?? 0;
          const sign = v > 0 ? "+" : "";
          const pct = ((v + 100) / 200) * 100;
          const statusLabel = v >= 75 ? "ALLIED" : v >= 25 ? "FRIENDLY" : v >= -25 ? "NEUTRAL" : v >= -75 ? "HOSTILE" : "NEMESIS";
          const statusColor = v >= 25 ? PALETTE.hpGreen : v >= -25 ? PALETTE.dim2 : PALETTE.danger;
          return (
            <div key={f.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: f.color, letterSpacing: 1.5, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{f.key} — {f.name}</span>
                <span style={{ fontSize: 9, color: statusColor, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{sign}{v} · {statusLabel}</span>
              </div>
              <div style={{ position: "relative", height: 14, background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, borderRadius: 1 }}>
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: PALETTE.dim, opacity: 0.6 }} />
                <div style={{
                  position: "absolute",
                  top: 1, bottom: 1,
                  left: v >= 0 ? "50%" : `${pct}%`,
                  width: v >= 0 ? `${pct - 50}%` : `${50 - pct}%`,
                  background: f.color, opacity: 0.65, transition: "all 0.3s",
                }} />
                <input type="range" min={-100} max={100} value={v} onChange={e => onChange({ ...reputation, [f.key]: parseInt(e.target.value, 10) })}
                  style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Wounds / injury log
function WoundsLog({ wounds, onChange }) {
  const [sel, setSel] = useState(WOUND_OPTIONS[0]);
  const [custom, setCustom] = useState("");

  const add = (text) => {
    if (!text) return;
    onChange([...(wounds || []), { text, date: new Date().toISOString().slice(0, 10) }]);
    setCustom("");
  };
  const remove = (i) => onChange(wounds.filter((_, j) => j !== i));

  return (
    <div style={boxStyle}>
      <SectionLabel>PERMANENT WOUNDS / INJURY LOG</SectionLabel>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <select value={sel} onChange={e => setSel(e.target.value)} style={{ ...selectStyle, flex: 1, fontSize: 10 }}>
          {WOUND_OPTIONS.map(w => <option key={w}>{w}</option>)}
        </select>
        <button onClick={() => add(sel)} style={{ background: PALETTE.accent, border: "none", color: "#000", padding: "0 12px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 1, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>+ ADD</button>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Custom wound / trauma..." style={{ ...inputStyle, flex: 1, fontSize: 10 }} onKeyDown={e => e.key === "Enter" && add(custom)} />
        <button onClick={() => add(custom)} disabled={!custom} style={{ background: "transparent", border: `1px solid ${PALETTE.accent}`, color: PALETTE.accent, padding: "0 12px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 1, cursor: "pointer", fontSize: 10, borderRadius: 2, opacity: custom ? 1 : 0.4 }}>+</button>
      </div>
      {wounds && wounds.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 140, overflowY: "auto" }}>
          {wounds.map((w, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, padding: "5px 8px", borderRadius: 2 }}>
              <div>
                <span style={{ fontSize: 10, color: PALETTE.danger, marginRight: 6 }}>⚠</span>
                <span style={{ fontSize: 10, color: PALETTE.text }}>{w.text}</span>
                <span style={{ fontSize: 8, color: PALETTE.dim2, marginLeft: 6, letterSpacing: 1 }}>[{w.date}]</span>
              </div>
              <button onClick={() => remove(i)} style={{ background: "transparent", border: "none", color: PALETTE.dim2, cursor: "pointer", fontSize: 11 }}>✕</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 10, color: PALETTE.dim2, fontStyle: "italic" }}>Tidak ada luka permanen tercatat.</div>
      )}
    </div>
  );
}


// ============================================================
// SETUP SCREEN — first-time Supabase credentials
// ============================================================

function SetupScreen({ onSetup }) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [showSql, setShowSql] = useState(false);
  const [demo, setDemo] = useState(false);
  const [err, setErr] = useState("");

  const connect = () => {
    if (!url || !key) { setErr("URL dan anon key wajib diisi"); return; }
    if (!/supabase\.co/.test(url)) { setErr("URL Supabase tidak valid"); return; }
    onSetup({ url: url.trim(), key: key.trim(), mode: "supabase" });
  };

  const sql = `-- Jalankan SQL ini di Supabase SQL Editor
-- ── CORE: characters ──────────────────────────────────────
CREATE TABLE warbound_characters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Pilot Baru',
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE warbound_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own chars" ON warbound_characters
  FOR ALL USING (auth.uid() = user_id);

-- ── PROFILES: player vs gm role ───────────────────────────
CREATE TABLE warbound_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'player', -- 'player' | 'gm'
  display_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE warbound_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads profiles" ON warbound_profiles FOR SELECT USING (true);
CREATE POLICY "Own profile write" ON warbound_profiles FOR ALL USING (auth.uid() = user_id);

-- ── GM: encounter sessions ────────────────────────────────
CREATE TABLE warbound_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gm_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_name text NOT NULL DEFAULT 'Untitled Session',
  data jsonb NOT NULL DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE warbound_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GMs own sessions" ON warbound_sessions FOR ALL USING (auth.uid() = gm_id);

-- ── STORAGE: portraits & mech illustrations ───────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('warbound-assets', 'warbound-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'warbound-assets');
CREATE POLICY "Users upload own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'warbound-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own" ON storage.objects FOR DELETE
  USING (bucket_id = 'warbound-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── NPC POOL: 280 pre-built NPC dari rule set (read-only) ─
CREATE TABLE warbound_npc_pool (
  id_varian text PRIMARY KEY,
  data jsonb NOT NULL
);
ALTER TABLE warbound_npc_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read NPC pool" ON warbound_npc_pool FOR SELECT USING (true);
-- Seed NPC pool pakai file warbound_npc_seed.sql (dilampirkan terpisah)

-- ── CUSTOM NPC: GM bikin custom unit dari job/weapon/armor ─
CREATE TABLE warbound_npcs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE warbound_npcs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GMs manage own NPCs" ON warbound_npcs FOR ALL USING (auth.uid() = created_by);

-- ── REALTIME: aktifkan realtime subscription untuk party monitor ─
ALTER PUBLICATION supabase_realtime ADD TABLE warbound_characters;`;

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Share Tech Mono',monospace", color: PALETTE.text }}>
      <div style={{ maxWidth: 560, width: "100%", background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, padding: 30, borderRadius: 2 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900, color: PALETTE.accent, letterSpacing: 6, marginBottom: 3 }}>WARBOUND</div>
        <div style={{ fontSize: 9, color: PALETTE.dim, letterSpacing: 3, marginBottom: 22 }}>SYSTEM SETUP — CHARACTER DATABASE</div>

        <div style={labelStyle}>SUPABASE URL</div>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxxx.supabase.co" style={{ ...inputStyle, marginBottom: 14 }} />
        <div style={labelStyle}>ANON KEY</div>
        <input value={key} onChange={e => setKey(e.target.value)} placeholder="eyJhbGci..." style={{ ...inputStyle, marginBottom: 14 }} />

        {err && <div style={{ color: PALETTE.danger, fontSize: 11, marginBottom: 12 }}>✕ {err}</div>}

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={connect} style={{ flex: 1, background: PALETTE.accent, border: "none", color: "#000", padding: "10px 14px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 2, cursor: "pointer", fontSize: 11, borderRadius: 2 }}>CONNECT</button>
          <button onClick={() => onSetup({ mode: "local" })} style={{ background: "transparent", border: `1px solid ${PALETTE.borderAlt}`, color: PALETTE.text, padding: "10px 14px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 11, borderRadius: 2 }}>DEMO MODE</button>
        </div>

        <button onClick={() => setShowSql(!showSql)} style={{ background: "none", border: "none", color: PALETTE.accent, cursor: "pointer", fontSize: 10, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif" }}>
          {showSql ? "▾" : "▸"} BELUM SETUP? LIHAT SQL
        </button>
        {showSql && (
          <pre style={{ marginTop: 10, background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, padding: 12, fontSize: 10, color: PALETTE.text, whiteSpace: "pre-wrap", maxHeight: 260, overflow: "auto", borderRadius: 2 }}>{sql}</pre>
        )}

        <div style={{ marginTop: 20, fontSize: 9, color: PALETTE.dim2, lineHeight: 1.6 }}>
          DEMO MODE menyimpan data di memori session saja (tidak persist). Gunakan untuk mencoba char sheet tanpa setup Supabase.
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AUTH SCREEN
// ============================================================

function AuthScreen({ supabase, onAuth, onReset }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState("player");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setInfo(""); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        // Write profile row if we have a session; otherwise it'll be created on first login
        if (data.user) {
          try { await supabase.from("warbound_profiles").upsert({ user_id: data.user.id, role }); } catch (_) {}
        }
        if (data.user && !data.session) setInfo("Cek email untuk konfirmasi, lalu login.");
        else if (data.session) onAuth(data.user);
      }
    } catch (e) { setErr(e.message || "Error"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Share Tech Mono',monospace", color: PALETTE.text }}>
      <div style={{ maxWidth: 420, width: "100%", background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, padding: 30, borderRadius: 2 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, color: PALETTE.accent, letterSpacing: 5, marginBottom: 3 }}>WARBOUND</div>
        <div style={{ fontSize: 9, color: PALETTE.dim, letterSpacing: 3, marginBottom: 22 }}>PILOT AUTHENTICATION</div>

        <div style={{ display: "flex", marginBottom: 20, borderBottom: `1px solid ${PALETTE.borderAlt}` }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setErr(""); setInfo(""); }} style={{ flex: 1, background: "transparent", border: "none", color: mode === m ? PALETTE.accent : PALETTE.dim2, padding: "10px 0", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 2, cursor: "pointer", fontSize: 11, borderBottom: mode === m ? `2px solid ${PALETTE.accent}` : "2px solid transparent" }}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={labelStyle}>EMAIL</div>
        <input value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} />
        <div style={labelStyle}>PASSWORD</div>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} style={{ ...inputStyle, marginBottom: 14 }} />

        {mode === "register" && (
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>ROLE</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["player", "PLAYER"], ["gm", "GAME MASTER"]].map(([v, l]) => (
                <button key={v} onClick={() => setRole(v)} style={{ flex: 1, background: role === v ? PALETTE.accent : "transparent", border: `1px solid ${role === v ? PALETTE.accent : PALETTE.borderAlt}`, color: role === v ? "#000" : PALETTE.text, padding: "9px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 2, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>{l}</button>
              ))}
            </div>
          </div>
        )}

        {err && <div style={{ color: PALETTE.danger, fontSize: 11, marginBottom: 10 }}>✕ {err}</div>}
        {info && <div style={{ color: PALETTE.accent, fontSize: 11, marginBottom: 10 }}>✓ {info}</div>}

        <button onClick={submit} disabled={loading} style={{ width: "100%", background: PALETTE.accent, border: "none", color: "#000", padding: "11px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 3, cursor: loading ? "wait" : "pointer", fontSize: 11, marginBottom: 10, borderRadius: 2 }}>
          {loading ? "..." : (mode === "login" ? "LOGIN" : "REGISTER")}
        </button>
        <button onClick={onReset} style={{ background: "none", border: "none", color: PALETTE.dim2, cursor: "pointer", fontSize: 9, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif" }}>‹ RECONNECT SUPABASE</button>
      </div>
    </div>
  );
}

// ============================================================
// ROSTER SCREEN
// ============================================================

function RosterScreen({ supabase, user, chars, onLoad, onRefresh, onLogout, isDemo, onSwitchToGm }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const newChar = () => onLoad(null);

  const del = async (id) => {
    if (!confirm("Hapus karakter ini?")) return;
    if (isDemo) { onRefresh(chars.filter(c => c.id !== id)); return; }
    setLoading(true);
    const { error } = await supabase.from("warbound_characters").delete().eq("id", id);
    if (error) setErr(error.message); else onRefresh();
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, padding: 20, fontFamily: "'Share Tech Mono',monospace", color: PALETTE.text }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, color: PALETTE.accent, letterSpacing: 5 }}>WARBOUND</div>
            <div style={{ fontSize: 9, color: PALETTE.dim, letterSpacing: 3, marginTop: 3 }}>PILOT ROSTER {isDemo && "— DEMO MODE"}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {onSwitchToGm && <button onClick={onSwitchToGm} style={{ background: "transparent", border: `1px solid ${PALETTE.def}`, color: PALETTE.def, padding: "8px 14px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>◈ GM DASHBOARD</button>}
            <button onClick={onLogout} style={{ background: "transparent", border: `1px solid ${PALETTE.borderAlt}`, color: PALETTE.text, padding: "8px 14px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>LOGOUT</button>
          </div>
        </div>

        {user && <div style={{ fontSize: 10, color: PALETTE.dim2, marginBottom: 22 }}>SIGNED IN: {user.email}</div>}
        {err && <div style={{ color: PALETTE.danger, fontSize: 11, marginBottom: 12 }}>✕ {err}</div>}

        <button onClick={newChar} style={{ background: PALETTE.accent, border: "none", color: "#000", padding: "12px 22px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 3, cursor: "pointer", fontSize: 11, marginBottom: 22, borderRadius: 2 }}>+ CREATE NEW PILOT</button>

        {chars.length === 0 ? (
          <div style={{ ...boxStyle, padding: 50, textAlign: "center", color: PALETTE.dim2, fontSize: 12 }}>
            BELUM ADA KARAKTER. KLIK "CREATE NEW PILOT" UNTUK MULAI.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {chars.map(c => {
              const d = c.data || {};
              const chassis = d.chassis || "HEAVY";
              return (
                <div key={c.id} style={{ ...boxStyle, borderLeft: `3px solid ${PALETTE.accent}`, cursor: "pointer", transition: "background 0.15s" }} onClick={() => onLoad(c)} onMouseEnter={e => e.currentTarget.style.background = PALETTE.surface2} onMouseLeave={e => e.currentTarget.style.background = PALETTE.surface}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, color: PALETTE.textBright, marginBottom: 6, letterSpacing: 1 }}>{c.name || "UNNAMED"}</div>
                  <div style={{ fontSize: 9, color: PALETTE.dim2, letterSpacing: 2, marginBottom: 4 }}>
                    SCAR-{chassis} · {d.job || "NO JOB"}
                  </div>
                  <div style={{ fontSize: 9, color: PALETTE.dim2, marginBottom: 10 }}>
                    Updated: {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "—"}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); onLoad(c); }} style={{ flex: 1, background: "transparent", border: `1px solid ${PALETTE.accent}`, color: PALETTE.accent, padding: "7px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 9, borderRadius: 2 }}>OPEN</button>
                    <button onClick={e => { e.stopPropagation(); del(c.id); }} style={{ background: "transparent", border: `1px solid ${PALETTE.danger}`, color: PALETTE.danger, padding: "7px 10px", cursor: "pointer", fontSize: 11, borderRadius: 2 }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CHARACTER SHEET (main view)
// ============================================================

function CharSheet({ charId, initialData, onSave, onBack, isDemo, supabase, user }) {
  const defaults = {
    chassis: "HEAVY",
    unitName: "",
    job: "—",
    pilotName: "",
    pilotGender: "F",
    tier: "T0",
    faction: "—",
    weapon1: "EMPTY",
    weapon2: "EMPTY",
    armor: "EMPTY",
    leg: "Basic Legs",
    thruster: "EMPTY",
    acc1: "EMPTY",
    acc2: "EMPTY",
    ammo1: 0,
    ammo2: 0,
    hpCurrent: null,
    hpOrganic: 12,
    pilotDamage: 0,
    statuses: {},
    pilotStatuses: {},
    plague: 0,
    skillUsed: {},
    inventory: Array(6).fill({ name: "EMPTY", notes: "" }),
    ration: 0,
    backstory: "",
    notes: "",
    // --- v2 additions ---
    hungerLv: 0,
    customTitle: "",
    killCount: 0,
    portraitUrl: "",
    mechUrl: "",
    reputation: { PU: 0, AR: 0, SAU: 0, OCE: 0, MEC: 0, ATL: 0 },
    wounds: [], // array of { text, date }
    skillLog: [], // audit log of USE/USED events: { skill, at }
  };

  const [state, setState] = useState(() => ({ ...defaults, ...(initialData || {}) }));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const set = (k, v) => setState(s => ({ ...s, [k]: typeof v === "function" ? v(s[k]) : v }));

  const cd = CHASSIS_DATA[state.chassis];
  const jobData = JOBS[state.job] || JOBS["—"];
  const selW1 = WEAPONS.find(w => w.name === state.weapon1) || WEAPONS[0];
  const selW2 = WEAPONS.find(w => w.name === state.weapon2) || WEAPONS[0];
  const selA = ARMORS.find(a => a.name === state.armor) || ARMORS[0];
  const selL = LEGS.find(l => l.name === state.leg) || LEGS[0];
  const selT = THRUSTERS.find(t => t.name === state.thruster) || THRUSTERS[0];
  const selAcc1 = ACCESSORIES.find(a => a.name === state.acc1) || ACCESSORIES[0];
  const selAcc2 = ACCESSORIES.find(a => a.name === state.acc2) || ACCESSORIES[0];

  const stats = useMemo(() => {
    const { STR, DEX, VIT, AGI, INT } = jobData;
    const hasJob = state.job !== "—";
    const hpTotal = hasJob ? Math.floor(cd.BASE_HP + (VIT + AGI) * cd.HP_MULT) : cd.BASE_HP;
    const defTotal = cd.BASE_DEF + (hasJob ? Math.floor(VIT / 3) : 0) + (selA.defBonus || 0) + (selL.defBonus || 0);
    const moveTotal = cd.BASE_MOVE + (hasJob ? Math.floor(AGI / 2) : 0) + (selL.moveBonus || 0) + (selT.moveBonus || 0);
    const accu = hasJob ? DEX + Math.floor(AGI / 2) : 0;
    // pilot attr (organic, tanpa SCAR)
    const pAccu = hasJob ? DEX : 0;
    const pDef = hasJob ? 10 + Math.floor(AGI / 2) + Math.floor(VIT / 3) : 10;
    const pMove = hasJob ? 6 + Math.floor(AGI / 3) : 6;
    return { STR, DEX, VIT, AGI, INT, hpTotal, defTotal, moveTotal, accu, pAccu, pDef, pMove };
  }, [state.job, state.chassis, selA, selL, selT]);

  const weightUsed = (cd.BASE_WEIGHT || 0) + selW1.berat + selW2.berat + selA.berat + selL.berat + selT.berat + selAcc1.berat + selAcc2.berat;
  const weightCap = cd.BASE_WEIGHT + WEIGHT_LIMIT[state.chassis];
  const costTotal = selW1.harga + selW2.harga + selA.harga + selL.harga + selT.harga + selAcc1.harga + selAcc2.harga;

  const hpMax = stats.hpTotal;
  const hpNow = state.hpCurrent === null ? hpMax : state.hpCurrent;
  const hpPct = Math.max(0, Math.min(100, (hpNow / hpMax) * 100));
  const hpCol = hpPct > 50 ? PALETTE.hpGreen : hpPct > 25 ? PALETTE.hpAmber : PALETTE.hpRed;
  const orgMax = 12 + (stats.VIT || 0);
  const orgNow = Math.max(0, orgMax - state.pilotDamage);
  const orgCol = orgNow / orgMax > 0.5 ? PALETTE.hpGreen : orgNow / orgMax > 0.25 ? PALETTE.hpAmber : PALETTE.hpRed;

  const plagueStage = PLAGUE_STAGES.find(s => state.plague >= s.min && state.plague <= s.max) || PLAGUE_STAGES[0];

  const onChassis = (ch) => {
    setState(s => ({ ...s, chassis: ch, weapon2: "EMPTY", skillUsed: {}, statuses: {}, hpCurrent: null }));
  };

  const resetSession = () => {
    if (!confirm("Reset sesi? HP, status, skill usage akan di-reset.")) return;
    setState(s => ({ ...s, hpCurrent: null, pilotDamage: 0, pilotStatuses: {}, statuses: {}, skillUsed: {} }));
  };
  const resetFull = () => {
    if (!confirm("RESET FULL: semua data kecuali nama & job akan di-reset. Lanjut?")) return;
    setState(s => ({ ...defaults, chassis: s.chassis, unitName: s.unitName, pilotName: s.pilotName, job: s.job }));
  };

  const save = async () => {
    setSaving(true); setSaveMsg("");
    try {
      await onSave({ name: state.pilotName || state.unitName || "Pilot Baru", data: state });
      setSaveMsg("✓ TERSIMPAN");
      setTimeout(() => setSaveMsg(""), 2200);
    } catch (e) {
      setSaveMsg("✕ " + (e.message || "gagal simpan"));
    }
    setSaving(false);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ name: state.pilotName || "Pilot", data: state }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warbound-${(state.pilotName || "pilot").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // styles scoped
  const dropBox = { ...boxStyle, padding: 10, marginBottom: 10 };

  return (
    <div style={{ fontFamily: "'Share Tech Mono','Courier New',monospace", background: PALETTE.bg, minHeight: "100vh", color: PALETTE.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@500;700;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:${PALETTE.surface2}}::-webkit-scrollbar-thumb{background:${PALETTE.accent}}
        input:focus,select:focus,textarea:focus{border-color:${PALETTE.accent}!important;outline:none}
        button:hover{opacity:0.85}
        .wb-grid-main{display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:14px}
        .wb-pilot-grid{display:grid;grid-template-columns:220px 1fr 1.3fr;gap:14px}
        @media (max-width:1100px){.wb-grid-main{grid-template-columns:1fr}.wb-pilot-grid{grid-template-columns:1fr}}
      `}</style>

      {/* TOP BAR */}
      <div style={{ borderBottom: `1px solid ${PALETTE.borderAlt}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: PALETTE.bg, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${PALETTE.borderAlt}`, color: PALETTE.text, padding: "6px 12px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>‹ ROSTER</button>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: PALETTE.accent, letterSpacing: 5, lineHeight: 1 }}>WARBOUND</div>
            <div style={{ fontSize: 8, color: PALETTE.dim, letterSpacing: 3, marginTop: 3 }}>CHARACTER SYSTEM — SRD v3.4 {isDemo && "· DEMO"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saveMsg && <div style={{ fontSize: 10, color: saveMsg.startsWith("✓") ? PALETTE.hpGreen : PALETTE.danger, letterSpacing: 2, marginRight: 6 }}>{saveMsg}</div>}
          <div style={{ display: "flex", border: `1px solid ${PALETTE.borderAlt}`, borderRadius: 2, overflow: "hidden" }}>
            {["HEAVY", "MEDIUM", "LIGHT"].map(c => (
              <button key={c} onClick={() => onChassis(c)} style={{ background: state.chassis === c ? PALETTE.accent : "transparent", border: "none", color: state.chassis === c ? "#000" : PALETTE.text, padding: "7px 14px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 2, cursor: "pointer", fontSize: 10 }}>{c}</button>
            ))}
          </div>
          <button onClick={exportJson} style={{ background: "transparent", border: `1px solid ${PALETTE.borderAlt}`, color: PALETTE.text, padding: "7px 12px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>↓ EXPORT</button>
          <button onClick={save} disabled={saving} style={{ background: PALETTE.accent, border: "none", color: "#000", padding: "7px 14px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 2, cursor: saving ? "wait" : "pointer", fontSize: 10, borderRadius: 2 }}>{saving ? "..." : "↑ SAVE"}</button>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 1400, margin: "0 auto" }}>
        {/* ======= ROW 1: HEADER STATS ======= */}
        <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, marginBottom: 14, display: "flex", alignItems: "stretch", borderRadius: 2 }}>
          {/* Unit Name */}
          <div style={{ padding: "8px 14px", minWidth: 200, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={labelStyle}>UNIT NAME</div>
            <input value={state.unitName} onChange={e => set("unitName", e.target.value)} placeholder="SCAR-HEAVY TITAN" style={{ ...inputStyle, background: "transparent", border: "none", borderBottom: `1px solid ${PALETTE.borderAlt}`, padding: "4px 0", fontSize: 13, color: PALETTE.textBright, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 2 }} />
          </div>
          {/* ATRIBUTE group */}
          <div style={{ flex: 1.4, display: "flex", borderLeft: `1px solid ${PALETTE.borderAlt}`, position: "relative" }}>
            <div style={{ position: "absolute", top: 3, left: "50%", transform: "translateX(-50%)", fontSize: 8, color: PALETTE.dim, letterSpacing: 3, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>ATRIBUTE</div>
            <HeaderStatCell label="ACCU" value={stats.accu} />
            <HeaderStatCell label="DEF" value={stats.defTotal} color={PALETTE.def} />
            <HeaderStatCell label="MOVE" value={stats.moveTotal} color={PALETTE.move} />
          </div>
          <HeaderStatCell label="LIMIT COST" value={`$${costTotal.toLocaleString()}`} color={PALETTE.accent} sub="TOTAL" accent />
          <HeaderStatCell label="HEALTH POINT" value={hpNow} color={hpCol} sub={`/ ${hpMax}`} accent />
          <HeaderStatCell label="LIMIT WEIGHT" value={`${weightUsed}t`} color={weightUsed > weightCap ? PALETTE.danger : PALETTE.text} sub={`/ ${weightCap}t`} accent />
          <HeaderStatCell label="DAMAGE / SCAR" value={hpMax - hpNow} color={PALETTE.danger} accent />
          <HeaderStatCell label="CONDITION" value={Object.keys(state.statuses).filter(s => state.statuses[s]).length || "—"} sub="EFFECTS" accent />
        </div>

        {/* ======= ROW 2: SCAR SECTION ======= */}
        <div className="wb-grid-main" style={{ marginBottom: 14 }}>
          {/* LEFT COLUMN */}
          <div>
            <ModuleSlot label="SLOT ARMED" value={state.weapon1} options={WEAPONS} onChange={v => set("weapon1", v)} item={selW1} showType cost={selW1.harga} weight={selW1.berat} dmg={selW1.dmg} />
            <ModuleSlot label="MODUL DEF" value={state.armor} options={ARMORS} onChange={v => set("armor", v)} item={selA} showType weight={selA.berat} />
            <ModuleSlot label="THRUSTER" value={state.thruster} options={THRUSTERS} onChange={v => set("thruster", v)} item={selT} weight={selT.berat} bonus={selT.moveBonus ? `MOVE +${selT.moveBonus}` : ""} />
          </div>

          {/* CENTER — MECH */}
          <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, padding: 14, borderRadius: 2, display: "flex", flexDirection: "column", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: PALETTE.dim, letterSpacing: 3, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, marginBottom: 6 }}>
              <span>SCAR-{state.chassis}</span>
              <span>{state.tier} · {state.faction.split(" ")[0]}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, position: "relative" }}>
              {/* corner marks */}
              {[[0,0],[0,1],[1,0],[1,1]].map(([x,y],i) => (
                <div key={i} style={{ position: "absolute", [y?"bottom":"top"]: 4, [x?"right":"left"]: 4, width: 10, height: 10, borderTop: !y ? `1px solid ${PALETTE.accent}` : "none", borderBottom: y ? `1px solid ${PALETTE.accent}` : "none", borderLeft: !x ? `1px solid ${PALETTE.accent}` : "none", borderRight: x ? `1px solid ${PALETTE.accent}` : "none" }} />
              ))}
              {state.mechUrl ? (
                <ImageUpload
                  url={state.mechUrl}
                  onUrlChange={(u) => set("mechUrl", u)}
                  slot="mech"
                  supabase={supabase}
                  userId={user?.id}
                  isDemo={isDemo}
                  aspectLabel="MECH"
                  style={{ width: "100%", height: "100%", minHeight: 300 }}
                  fallback={<MechSvg chassis={state.chassis} />}
                />
              ) : (
                <>
                  <MechSvg chassis={state.chassis} />
                  <div style={{ position: "absolute", bottom: 8, right: 8 }}>
                    <ImageUpload
                      url=""
                      onUrlChange={(u) => set("mechUrl", u)}
                      slot="mech"
                      supabase={supabase}
                      userId={user?.id}
                      isDemo={isDemo}
                      aspectLabel="MECH ART"
                      style={{ width: 110, height: 30 }}
                      fallback={<span style={{ fontSize: 8, color: PALETTE.dim2, letterSpacing: 1 }}>UPLOAD MECH</span>}
                    />
                  </div>
                </>
              )}
            </div>
            <div style={{ textAlign: "center", fontSize: 9, color: PALETTE.accent, letterSpacing: 5, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, marginTop: 8 }}>
              SCAR {state.chassis} CLASS
            </div>
            {/* HP controls under mech */}
            <div style={{ marginTop: 12, padding: 10, background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, borderRadius: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ ...labelStyle, margin: 0 }}>HP SCAR</span>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, color: hpCol, fontWeight: 700 }}>{hpNow} / {hpMax}</span>
              </div>
              <HpBar current={hpNow} max={hpMax} color={hpCol} />
              <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                {[-5, -1, 1, 5].map(d => (
                  <button key={d} onClick={() => set("hpCurrent", Math.max(0, Math.min(hpMax, hpNow + d)))} style={{ ...btnStyle, width: "auto", padding: "0 8px", color: d < 0 ? PALETTE.danger : PALETTE.hpGreen }}>{d > 0 ? `+${d}` : d}</button>
                ))}
                <button onClick={() => set("hpCurrent", null)} style={{ ...btnStyle, width: "auto", padding: "0 10px", color: PALETTE.accent, fontSize: 9, letterSpacing: 1 }}>RST</button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {state.chassis === "HEAVY" && (
              <ModuleSlot label="SLOT ARMED 2" value={state.weapon2} options={WEAPONS} onChange={v => set("weapon2", v)} item={selW2} showType cost={selW2.harga} weight={selW2.berat} dmg={selW2.dmg} />
            )}
            {/* BACKPACK AMMO row */}
            <div style={{ marginBottom: 10 }}>
              <SectionLabel>BACKPACK — AMMO</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <AmmoSlot label="AMMO 1" value={state.ammo1} setValue={v => set("ammo1", v)} />
                <AmmoSlot label="AMMO 2" value={state.ammo2} setValue={v => set("ammo2", v)} />
              </div>
            </div>
            {/* ACCESORIS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <ModuleSlot compact label="ACCESORIS 1" value={state.acc1} options={ACCESSORIES} onChange={v => set("acc1", v)} item={selAcc1} cost={selAcc1.harga} weight={selAcc1.berat} />
              <ModuleSlot compact label="ACCESORIS 2" value={state.acc2} options={ACCESSORIES} onChange={v => set("acc2", v)} item={selAcc2} cost={selAcc2.harga} weight={selAcc2.berat} />
            </div>
            <ModuleSlot label="MODUL LEG" value={state.leg} options={LEGS} onChange={v => set("leg", v)} item={selL} weight={selL.berat} bonus={`DEF +${selL.defBonus} · MOVE +${selL.moveBonus}`} />
          </div>
        </div>

        {/* ======= ROW 3: PILOT SECTION ======= */}
        <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, borderTop: `2px solid ${PALETTE.accent}`, padding: 16, borderRadius: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${PALETTE.borderAlt}` }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: PALETTE.textBright, letterSpacing: 5 }}>PILOT ////</div>
            <div style={{ fontSize: 9, color: PALETTE.dim, letterSpacing: 3, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>ARMORTECH · PILOT SUIT SYSTEM</div>
          </div>

          <div className="wb-pilot-grid">
            {/* LEFT — portrait + status */}
            <div>
              {/* Main portrait upload */}
              <div style={{ marginBottom: 10 }}>
                <ImageUpload
                  url={state.portraitUrl}
                  onUrlChange={(u) => set("portraitUrl", u)}
                  slot="portrait"
                  supabase={supabase}
                  userId={user?.id}
                  isDemo={isDemo}
                  aspectLabel="PORTRAIT"
                  style={{ width: "100%", aspectRatio: "3/4", maxHeight: 260 }}
                  fallback={
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 12 }}>
                      <PilotSvg gender={state.pilotGender} selected={true} onClick={() => {}} label={state.pilotGender === "F" ? "P-01 FEMALE" : "P-02 MALE"} />
                    </div>
                  }
                />
                {/* Gender toggle for SVG fallback */}
                {!state.portraitUrl && (
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    {[["F", "P-01 FEMALE"], ["M", "P-02 MALE"]].map(([g, l]) => (
                      <button key={g} onClick={() => set("pilotGender", g)} style={{ flex: 1, background: state.pilotGender === g ? PALETTE.accent : "transparent", border: `1px solid ${state.pilotGender === g ? PALETTE.accent : PALETTE.borderAlt}`, color: state.pilotGender === g ? "#000" : PALETTE.text, padding: "5px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, cursor: "pointer", fontSize: 8, borderRadius: 2, fontWeight: 700 }}>{l}</button>
                    ))}
                  </div>
                )}
              </div>
              {/* Status checklist */}
              <div style={{ ...boxStyle, padding: 0, overflow: "hidden", marginBottom: 10 }}>
                {PILOT_STATUS.map((s, i) => (
                  <div key={s} onClick={() => set("pilotStatuses", p => ({ ...p, [s]: !p[s] }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderBottom: i < 3 ? `1px solid ${PALETTE.borderAlt}` : "none", cursor: "pointer", background: state.pilotStatuses[s] ? "rgba(220,38,38,0.08)" : "transparent", transition: "background 0.15s" }}>
                    <span style={{ fontSize: 10, color: state.pilotStatuses[s] ? PALETTE.danger : PALETTE.text, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>
                      ◈ {s}
                    </span>
                    <span style={{ fontSize: 9, color: state.pilotStatuses[s] ? PALETTE.danger : PALETTE.dim2, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>
                      {state.pilotStatuses[s] ? "TRUE" : "FALSE"}
                    </span>
                  </div>
                ))}
              </div>
              {/* Hunger bar */}
              <HungerBar level={state.hungerLv || 0} onChange={v => set("hungerLv", v)} />
            </div>

            {/* CENTER — stats + HP + attr */}
            <div>
              {/* Job selector */}
              <div style={{ ...boxStyle, marginBottom: 10 }}>
                <div style={labelStyle}>JOB</div>
                <select value={state.job} onChange={e => { set("job", e.target.value); set("skillUsed", {}); }} style={selectStyle}>
                  {Object.keys(JOBS).map(j => <option key={j}>{j}</option>)}
                </select>
                {state.job !== "—" && (
                  <div style={{ marginTop: 6, fontSize: 9, color: PALETTE.dim2, letterSpacing: 1 }}>
                    CHASSIS: {jobData.CHASSIS}
                  </div>
                )}
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4, marginBottom: 10 }}>
                {[["STR", stats.STR], ["DEX", stats.DEX], ["VIT", stats.VIT], ["AGI", stats.AGI], ["INT", stats.INT]].map(([l, v]) => (
                  <div key={l} style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, padding: "8px 4px", textAlign: "center", borderRadius: 2 }}>
                    <div style={{ fontSize: 8, color: PALETTE.dim, letterSpacing: 1.5, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{l}</div>
                    <div style={{ fontSize: 18, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, color: PALETTE.textBright, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Pilot name + HP organic */}
              <div style={{ ...boxStyle, marginBottom: 10 }}>
                <div style={labelStyle}>PILOT NAME</div>
                <input value={state.pilotName} onChange={e => set("pilotName", e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} placeholder="—" />
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={labelStyle}>HP ORGANIK</div>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, color: orgCol, fontWeight: 700, lineHeight: 1 }}>{orgNow} <span style={{ fontSize: 11, color: PALETTE.dim2 }}>/ {orgMax}</span></div>
                  </div>
                  <Spinner value={state.pilotDamage} setValue={v => set("pilotDamage", Math.max(0, Math.min(orgMax, v)))} min={0} max={orgMax} />
                </div>
                <HpBar current={orgNow} max={orgMax} color={orgCol} />
              </div>

              {/* Pilot Attribute */}
              <div style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, borderRadius: 2 }}>
                <div style={{ padding: "6px 10px", borderBottom: `1px solid ${PALETTE.borderAlt}`, fontSize: 9, color: PALETTE.accent, letterSpacing: 3, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, textAlign: "center" }}>PILOT ATTRIBUTE (ORGANIK)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                  {[["ACCU", stats.pAccu], ["DEF", stats.pDef, PALETTE.def], ["MOVE", stats.pMove, PALETTE.move]].map(([l, v, c]) => (
                    <div key={l} style={{ padding: "10px 4px", textAlign: "center", borderRight: l !== "MOVE" ? `1px solid ${PALETTE.borderAlt}` : "none" }}>
                      <div style={{ fontSize: 8, color: PALETTE.dim, letterSpacing: 1.5, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{l}</div>
                      <div style={{ fontSize: 18, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, color: c || PALETTE.textBright, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — Job skills + Backpack */}
            <div>
              {/* Skills table */}
              <div style={{ marginBottom: 12 }}>
                <SectionLabel>JOB · SKILL</SectionLabel>
                {jobData.skills.length === 0 ? (
                  <div style={{ ...boxStyle, padding: 16, textAlign: "center", color: PALETTE.dim2, fontSize: 10 }}>PILIH JOB UNTUK LIHAT SKILL</div>
                ) : (
                  <div style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, borderRadius: 2, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                      <thead>
                        <tr style={{ background: PALETTE.surface, borderBottom: `1px solid ${PALETTE.borderAlt}` }}>
                          <th style={thStyle}>TYPE</th>
                          <th style={thStyle}>SKILL</th>
                          <th style={thStyle}>KETERANGAN</th>
                          <th style={{ ...thStyle, width: 60 }}>CHECK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobData.skills.map((sk, i) => {
                          const isUsed = state.skillUsed[sk.name];
                          const catCol = sk.cat === "BATTLE" ? PALETTE.danger : sk.cat === "SOCIAL" ? PALETTE.accent : PALETTE.def;
                          return (
                            <tr key={i} style={{ borderBottom: i < jobData.skills.length - 1 ? `1px solid ${PALETTE.borderAlt}` : "none" }}>
                              <td style={{ ...tdStyle, width: 60 }}>
                                <div style={{ fontSize: 8, color: catCol, letterSpacing: 1.5, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, textAlign: "center" }}>
                                  ▼<br />{sk.cat}
                                </div>
                              </td>
                              <td style={{ ...tdStyle, color: PALETTE.textBright, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 1, width: 130 }}>
                                {sk.name}
                                <div style={{ fontSize: 8, color: PALETTE.dim2, letterSpacing: 1, marginTop: 2, fontWeight: 400 }}>{sk.type}</div>
                              </td>
                              <td style={{ ...tdStyle, color: PALETTE.text, lineHeight: 1.35 }}>{sk.desc}</td>
                              <td style={{ ...tdStyle, width: 60, textAlign: "center" }}>
                                <button onClick={() => {
                                  const nowUsed = !isUsed;
                                  setState(s => ({
                                    ...s,
                                    skillUsed: { ...s.skillUsed, [sk.name]: nowUsed },
                                    skillLog: [...(s.skillLog || []), { skill: sk.name, action: nowUsed ? "USED" : "RESET", at: new Date().toISOString() }].slice(-30),
                                  }));
                                }} style={{ background: "transparent", border: `1px solid ${isUsed ? PALETTE.accent : PALETTE.borderAlt}`, color: isUsed ? PALETTE.accent : PALETTE.dim2, padding: "4px 6px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, cursor: "pointer", fontSize: 8, borderRadius: 2 }}>
                                  {isUsed ? "USED" : "USE"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Backpack inventory */}
              <SectionLabel>BACKPACK — INVENTORY</SectionLabel>
              <div style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, borderRadius: 2, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: PALETTE.surface, borderBottom: `1px solid ${PALETTE.borderAlt}` }}>
                      <th style={{ ...thStyle, width: 32 }}>+</th>
                      <th style={thStyle}>ITEM</th>
                      <th style={thStyle}>DMG / EFEK</th>
                      <th style={{ ...thStyle, width: 70 }}>COST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.inventory.map((slot, i) => {
                      const sel = ITEMS.find(it => it.name === slot.name) || ITEMS[0];
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${PALETTE.borderAlt}` }}>
                          <td style={{ ...tdStyle, textAlign: "center", color: PALETTE.accent, fontSize: 14 }}>+</td>
                          <td style={tdStyle}>
                            <select value={slot.name} onChange={e => set("inventory", inv => inv.map((s2, j) => j === i ? { ...s2, name: e.target.value } : s2))} style={{ ...selectStyle, fontSize: 10, padding: "3px 20px 3px 6px" }}>
                              {ITEMS.map(it => <option key={it.name}>{it.name}</option>)}
                            </select>
                          </td>
                          <td style={{ ...tdStyle, color: PALETTE.dim2 }}>{sel.efek}</td>
                          <td style={{ ...tdStyle, color: sel.harga > 0 ? PALETTE.accent : PALETTE.dim2, textAlign: "right", fontFamily: "'Orbitron',sans-serif" }}>
                            {sel.harga > 0 ? `$${sel.harga.toLocaleString()}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: PALETTE.surface }}>
                      <td style={{ ...tdStyle, textAlign: "center", color: PALETTE.accent, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>▸</td>
                      <td style={{ ...tdStyle, color: PALETTE.textBright, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 2 }}>RATION</td>
                      <td style={tdStyle}>
                        <Spinner value={state.ration} setValue={v => set("ration", v)} min={0} max={99} />
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", color: PALETTE.dim2 }}>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ARMORTECH footer strip + barcode */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, paddingTop: 12, borderTop: `1px solid ${PALETTE.borderAlt}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 22, height: 22, border: `1.5px solid ${PALETTE.accent}`, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)" }}>
                <div style={{ width: 8, height: 8, background: PALETTE.accent, transform: "rotate(-45deg)" }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 900, color: PALETTE.textBright, letterSpacing: 3 }}>ARMORTECH</div>
                <div style={{ fontSize: 7, color: PALETTE.dim, letterSpacing: 3, marginTop: 1 }}>PILOT SUIT SYSTEM</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", border: `1px solid ${PALETTE.borderAlt}`, borderRadius: 2 }}>
              <div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700, color: PALETTE.hpGreen, letterSpacing: 2 }}>SYSTEM ONLINE</div>
                <div style={{ fontSize: 7, color: PALETTE.dim, letterSpacing: 2, marginTop: 1 }}>STATUS : READY ////</div>
              </div>
              <Barcode />
            </div>
          </div>
        </div>

        {/* ======= EXTRAS: Plague, Statuses, Notes ======= */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
          {/* PLAGUE */}
          <div style={boxStyle}>
            <SectionLabel>GREY PLAGUE TRACKER</SectionLabel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 26, fontFamily: "'Orbitron',sans-serif", fontWeight: 900, color: plagueStage.color }}>{state.plague}</span>
              <span style={{ fontSize: 10, color: plagueStage.color, letterSpacing: 3, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{plagueStage.label}</span>
            </div>
            <HpBar current={state.plague} max={41} color={plagueStage.color} />
            <div style={{ fontSize: 9, color: PALETTE.dim2, marginTop: 6, lineHeight: 1.4 }}>{plagueStage.desc}</div>
            <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
              {[[-15, "OMEG"], [-5, "-5"], [-1, "-1"], [1, "+1"]].map(([d, l]) => (
                <button key={l} onClick={() => set("plague", Math.max(0, state.plague + d))} style={{ ...btnStyle, width: "auto", padding: "0 10px", color: d < 0 ? PALETTE.hpGreen : PALETTE.danger, fontSize: 9, letterSpacing: 1 }}>{l}</button>
              ))}
            </div>
          </div>

          {/* SCAR STATUS EFFECTS */}
          <div style={boxStyle}>
            <SectionLabel>SCAR — STATUS EFFECTS</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {["BURN", "STUN", "SHOCK", "EXPOSED", "MARK", "CORROSIVE"].map(s => (
                <button key={s} onClick={() => set("statuses", p => ({ ...p, [s]: !p[s] }))} style={{ background: state.statuses[s] ? "rgba(220,38,38,0.12)" : PALETTE.surface2, border: `1px solid ${state.statuses[s] ? PALETTE.danger : PALETTE.borderAlt}`, color: state.statuses[s] ? PALETTE.danger : PALETTE.text, padding: "8px 6px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 9, borderRadius: 2, fontWeight: 700 }}>{s}</button>
              ))}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
              <button onClick={resetSession} style={{ flex: 1, background: "transparent", border: `1px solid ${PALETTE.borderAlt}`, color: PALETTE.text, padding: "8px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 9, borderRadius: 2 }}>RESET SESI</button>
              <button onClick={resetFull} style={{ flex: 1, background: "transparent", border: `1px solid ${PALETTE.danger}`, color: PALETTE.danger, padding: "8px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 9, borderRadius: 2 }}>RESET FULL</button>
            </div>
          </div>

          {/* NOTES */}
          <div style={boxStyle}>
            <SectionLabel>BACKSTORY / CATATAN</SectionLabel>
            <textarea value={state.backstory} onChange={e => set("backstory", e.target.value)} placeholder="Latar belakang pilot..." style={{ ...inputStyle, minHeight: 50, resize: "vertical", fontSize: 10, lineHeight: 1.4, marginBottom: 6 }} />
            <textarea value={state.notes} onChange={e => set("notes", e.target.value)} placeholder="Catatan sesi..." style={{ ...inputStyle, minHeight: 50, resize: "vertical", fontSize: 10, lineHeight: 1.4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, color: PALETTE.dim2, letterSpacing: 1 }}>
              <span>TIER: <select value={state.tier} onChange={e => set("tier", e.target.value)} style={{ ...selectStyle, display: "inline-block", width: "auto", padding: "2px 18px 2px 4px", fontSize: 9 }}>{["T0","T1","T2","T3"].map(t => <option key={t}>{t}</option>)}</select></span>
              <span>FAKSI: <select value={state.faction} onChange={e => set("faction", e.target.value)} style={{ ...selectStyle, display: "inline-block", width: "auto", padding: "2px 18px 2px 4px", fontSize: 9 }}>{["—","Pacific Union (PU)","Aresian Republic (AR)","Saudi-UAE (SAU)","Oceanian Federation (OCE)","Mercenary Coalition (MEC)","Atlantic Remnant (ATL)"].map(f => <option key={f}>{f}</option>)}</select></span>
            </div>
          </div>
        </div>

        {/* ======= ROW: PROGRESSION · REPUTATION · WOUNDS ======= */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr 1.1fr", gap: 14, marginTop: 14 }}>
          {/* PROGRESSION & TITLE */}
          <div style={boxStyle}>
            <SectionLabel>PROGRESSION</SectionLabel>
            <div style={labelStyle}>CUSTOM TITLE</div>
            <input value={state.customTitle} onChange={e => set("customTitle", e.target.value)} placeholder="The Iron Ghost, Wraith-7, ..." style={{ ...inputStyle, marginBottom: 10 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, padding: 8, borderRadius: 2 }}>
                <div style={{ ...labelStyle, margin: "0 0 4px" }}>KILL COUNT</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 22, fontFamily: "'Orbitron',sans-serif", fontWeight: 900, color: PALETTE.danger, lineHeight: 1 }}>{state.killCount}</div>
                  <Spinner value={state.killCount} setValue={v => set("killCount", v)} min={0} max={9999} />
                </div>
              </div>
              <div style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, padding: 8, borderRadius: 2 }}>
                <div style={{ ...labelStyle, margin: "0 0 4px" }}>RATION</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 22, fontFamily: "'Orbitron',sans-serif", fontWeight: 900, color: state.ration > 0 ? PALETTE.hpGreen : PALETTE.danger, lineHeight: 1 }}>{state.ration}</div>
                  <Spinner value={state.ration} setValue={v => set("ration", v)} min={0} max={99} />
                </div>
              </div>
            </div>
            {/* Skill audit log */}
            {(state.skillLog || []).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={labelStyle}>SKILL ACTIVITY LOG</div>
                <div style={{ maxHeight: 100, overflowY: "auto", background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, padding: 6, borderRadius: 2 }}>
                  {[...state.skillLog].reverse().slice(0, 12).map((e, i) => (
                    <div key={i} style={{ fontSize: 9, color: PALETTE.dim2, letterSpacing: 1, marginBottom: 2 }}>
                      <span style={{ color: e.action === "USED" ? PALETTE.accent : PALETTE.hpGreen }}>{e.action}</span>
                      {" "}· {e.skill} <span style={{ color: PALETTE.dim, marginLeft: 4 }}>{new Date(e.at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* REPUTATION */}
          <ReputationMeter reputation={state.reputation || {}} onChange={r => set("reputation", r)} />

          {/* WOUNDS */}
          <WoundsLog wounds={state.wounds || []} onChange={w => set("wounds", w)} />
        </div>

        <div style={{ textAlign: "center", padding: "20px 0 10px", fontSize: 8, color: PALETTE.dim, letterSpacing: 4, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>
          //// WARBOUND CHAR SYSTEM · SRD v3.4 · 2120 ////
        </div>
      </div>
    </div>
  );
}

// — inline helpers for table
const thStyle = { padding: "6px 8px", fontSize: 8, color: PALETTE.accent, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, textAlign: "left", textTransform: "uppercase" };
const tdStyle = { padding: "7px 8px", fontSize: 10, color: PALETTE.text, verticalAlign: "middle" };

// Reusable module slot
function ModuleSlot({ label, value, options, onChange, item, cost, weight, dmg, bonus, showType, compact }) {
  const col = showType && item && item.type ? typeColor[item.type] : null;
  return (
    <div style={{ ...boxStyle, marginBottom: 10, padding: compact ? 8 : 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ ...labelStyle, margin: 0 }}>{label}</div>
        {dmg && dmg !== "—" && <div style={{ fontSize: 10, color: PALETTE.danger, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 1 }}>DMG {dmg}</div>}
      </div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...selectStyle, fontSize: compact ? 9 : 10, marginBottom: 6 }}>
        {options.map(o => <option key={o.name}>{o.name}</option>)}
      </select>
      {item && item.name !== "EMPTY" && item.name !== "Tidak Ada" && (
        <div style={{ borderLeft: `3px solid ${col || PALETTE.accent}`, paddingLeft: 8, marginBottom: 6 }}>
          {col && <div style={{ fontSize: 8, color: col, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, marginBottom: 3 }}>{item.type}</div>}
          {item.tags && item.tags !== "—" && <div style={{ fontSize: 8, color: PALETTE.dim2, letterSpacing: 1, marginBottom: 3 }}>{item.tags}</div>}
          <div style={{ fontSize: 9, color: PALETTE.text, lineHeight: 1.35 }}>{item.efek}</div>
          {bonus && <div style={{ fontSize: 9, color: PALETTE.accent, marginTop: 3, letterSpacing: 1 }}>{bonus}</div>}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: PALETTE.dim2, letterSpacing: 1, paddingTop: 4, borderTop: `1px solid ${PALETTE.borderAlt}` }}>
        {cost !== undefined && <span style={{ color: cost > 0 ? PALETTE.accent : PALETTE.dim2, fontFamily: "'Orbitron',sans-serif" }}>${cost.toLocaleString()}</span>}
        {weight !== undefined && <span style={{ fontFamily: "'Orbitron',sans-serif" }}>{weight}t</span>}
      </div>
    </div>
  );
}

function AmmoSlot({ label, value, setValue }) {
  return (
    <div style={{ ...boxStyle, padding: 8 }}>
      <div style={{ ...labelStyle, margin: "0 0 6px" }}>{label}</div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <Spinner value={value} setValue={setValue} min={0} max={999} />
      </div>
    </div>
  );
}

// ============================================================
// GM DASHBOARD — NPC picker, encounter tracker, quick-roll
// ============================================================

function GMDashboard({ supabase, user, isDemo, onLogout, onSwitchToPlayer }) {
  // NPC pool lazy-loaded from Supabase (or highlight pool for demo/unseeded)
  const [allNpcs, setAllNpcs] = useState(() => isDemo ? NPC_HIGHLIGHT_POOL : []);
  const [npcLoading, setNpcLoading] = useState(!isDemo);
  const [poolSource, setPoolSource] = useState(isDemo ? "demo" : "loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (isDemo) { setAllNpcs(NPC_HIGHLIGHT_POOL); setPoolSource("demo"); return; }
      setNpcLoading(true);
      const pool = await fetchNpcPool(supabase);
      const custom = await fetchCustomNpcs(supabase, user?.id);
      if (!alive) return;
      setAllNpcs([...pool, ...custom]);
      setPoolSource(pool === NPC_HIGHLIGHT_POOL ? "highlight" : "full");
      setNpcLoading(false);
    })();
    return () => { alive = false; };
  }, [supabase, user?.id, isDemo]);

  const reloadNpcs = async () => {
    invalidateNpcCaches();
    const pool = await fetchNpcPool(supabase);
    const custom = await fetchCustomNpcs(supabase, user?.id);
    setAllNpcs([...pool, ...custom]);
  };

  const [filter, setFilter] = useState({ arketype: "All", fraksi: "All", tier: "All", chassis: "All", q: "", source: "All" });
  const [activeUnits, setActiveUnits] = useState([]);
  const [missionName, setMissionName] = useState("Untitled Session");
  const [quickRoll, setQuickRoll] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [showNpcDetail, setShowNpcDetail] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showCreator, setShowCreator] = useState(false);

  // Party monitor (realtime)
  const [partyChars, setPartyChars] = useState([]);
  const [monitorActive, setMonitorActive] = useState(false);

  // derived filter options
  const arketypes = useMemo(() => ["All", ...Array.from(new Set(allNpcs.map(n => n.arketype).filter(Boolean)))], [allNpcs]);
  const fraksiList = useMemo(() => ["All", ...Array.from(new Set(allNpcs.map(n => n.fraksi).filter(Boolean)))], [allNpcs]);
  const tiers = ["All", 0, 1, 2];
  const chassises = useMemo(() => ["All", ...Array.from(new Set(allNpcs.map(n => n.chassis).filter(Boolean)))], [allNpcs]);

  const filtered = useMemo(() => {
    const q = filter.q.toLowerCase();
    return allNpcs.filter(n =>
      (filter.arketype === "All" || n.arketype === filter.arketype) &&
      (filter.fraksi === "All" || n.fraksi === filter.fraksi) &&
      (filter.tier === "All" || n.tier === filter.tier) &&
      (filter.chassis === "All" || n.chassis === filter.chassis) &&
      (filter.source === "All" || (filter.source === "custom" ? n.__custom : !n.__custom)) &&
      (!q || (n.name || "").toLowerCase().includes(q) || (n.id || "").toLowerCase().includes(q))
    );
  }, [allNpcs, filter]);

  // Encounter summary
  const encounterStats = useMemo(() => {
    const total = activeUnits.length;
    const hpSum = activeUnits.reduce((a, u) => a + u.hpNow, 0);
    const hpMaxSum = activeUnits.reduce((a, u) => a + u.npc.hp, 0);
    const pct = hpMaxSum > 0 ? Math.round((hpSum / hpMaxSum) * 100) : 0;
    const kritis = activeUnits.filter(u => u.hpNow > 0 && u.hpNow / u.npc.hp <= 0.25).length;
    const rusak = activeUnits.filter(u => u.hpNow > 0 && u.hpNow / u.npc.hp <= 0.5 && u.hpNow / u.npc.hp > 0.25).length;
    const hancur = activeUnits.filter(u => u.hpNow <= 0).length;
    return { total, hpSum, hpMaxSum, pct, kritis, rusak, hancur };
  }, [activeUnits]);

  const addNpc = (npc) => {
    const uid = Math.random().toString(36).slice(2, 9);
    setActiveUnits(p => [...p, { uid, npc, hpNow: npc.hp, status: {}, notes: "" }]);
  };
  const addMultiple = (npc, count) => {
    const c = parseInt(count, 10) || 1;
    for (let i = 0; i < c; i++) addNpc(npc);
  };
  const removeUnit = (uid) => setActiveUnits(p => p.filter(u => u.uid !== uid));
  const updateUnit = (uid, patch) => setActiveUnits(p => p.map(u => u.uid === uid ? { ...u, ...patch } : u));

  const rollOnTable = (table) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    // find matching entry
    const entry = table.entries.find(e => {
      const m = e.range.match(/(\d+)-(\d+)/);
      if (!m) return false;
      return roll >= parseInt(m[1]) && roll <= parseInt(m[2]);
    }) || table.entries[table.entries.length - 1];
    setQuickRoll({ tableName: table.name, roll, entry });
  };

  // Load GM's sessions
  const loadSessions = async () => {
    if (isDemo || !supabase || !user) return;
    const { data } = await supabase.from("warbound_sessions").select("*").eq("gm_id", user.id).order("updated_at", { ascending: false }).limit(10);
    setSessions(data || []);
  };
  useEffect(() => { loadSessions(); }, []);

  // ─── PARTY MONITOR — realtime subscription to warbound_characters ───
  const loadPartyChars = async () => {
    if (isDemo || !supabase) return;
    // GM sees ALL characters in the database (across all players)
    // This requires a separate RLS policy or GM-bypass. For playtest,
    // we rely on the default "users own" policy — so GMs will only see
    // characters they own. Note: shipping with a GM-read-all policy
    // requires an additional SQL grant; we document this limitation.
    const { data } = await supabase.from("warbound_characters").select("*").order("updated_at", { ascending: false });
    setPartyChars(data || []);
  };

  useEffect(() => {
    if (!monitorActive || isDemo || !supabase) return;
    loadPartyChars();
    const channel = supabase
      .channel("party-monitor")
      .on("postgres_changes", { event: "*", schema: "public", table: "warbound_characters" },
        (payload) => {
          setPartyChars(prev => {
            if (payload.eventType === "DELETE") {
              return prev.filter(c => c.id !== payload.old.id);
            }
            const next = [...prev];
            const idx = next.findIndex(c => c.id === payload.new.id);
            if (idx >= 0) next[idx] = payload.new;
            else next.unshift(payload.new);
            return next;
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [monitorActive, supabase, isDemo]);

  // Custom NPC: create / delete
  const deleteCustomNpc = async (npc) => {
    if (!npc.__custom || !npc.__row_id) return;
    if (!confirm(`Hapus NPC custom "${npc.name}"?`)) return;
    if (!isDemo && supabase) {
      await supabase.from("warbound_npcs").delete().eq("id", npc.__row_id);
    }
    await reloadNpcs();
  };

  const saveCustomNpc = async (npc) => {
    if (isDemo) {
      // demo mode: just add to in-memory list
      setAllNpcs(p => [...p, { ...npc, __custom: true, __row_id: `demo-${Date.now()}` }]);
      setShowCreator(false);
      return;
    }
    if (!supabase || !user) return;
    const { error } = await supabase.from("warbound_npcs").insert({ created_by: user.id, data: npc });
    if (error) { alert("Gagal simpan: " + error.message); return; }
    _customNpcCache = null;
    await reloadNpcs();
    setShowCreator(false);
  };

  const saveSession = async () => {
    setSaveMsg("");
    const payload = {
      mission_name: missionName,
      data: { activeUnits, missionName, updated: new Date().toISOString() },
    };
    if (isDemo) { setSaveMsg("✓ DEMO — tidak tersimpan permanen"); setTimeout(() => setSaveMsg(""), 2000); return; }
    try {
      if (sessionId) {
        await supabase.from("warbound_sessions").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", sessionId);
      } else {
        const { data, error } = await supabase.from("warbound_sessions").insert({ gm_id: user.id, ...payload }).select().single();
        if (error) throw error;
        setSessionId(data.id);
      }
      setSaveMsg("✓ TERSIMPAN");
      setTimeout(() => setSaveMsg(""), 2000);
      loadSessions();
    } catch (e) { setSaveMsg("✕ " + e.message); }
  };

  const loadSession = (s) => {
    setSessionId(s.id);
    setMissionName(s.mission_name);
    setActiveUnits(s.data?.activeUnits || []);
  };

  const newSession = () => {
    if (activeUnits.length > 0 && !confirm("Buat sesi baru? Encounter aktif akan dihapus.")) return;
    setSessionId(null); setMissionName("Untitled Session"); setActiveUnits([]);
  };

  return (
    <div style={{ fontFamily: "'Share Tech Mono','Courier New',monospace", background: PALETTE.bg, minHeight: "100vh", color: PALETTE.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@500;700;900&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:${PALETTE.surface2}}::-webkit-scrollbar-thumb{background:${PALETTE.accent}}
        input:focus,select:focus,textarea:focus{border-color:${PALETTE.accent}!important;outline:none}
        button:hover{opacity:0.85}
        .gm-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:14px}
        @media (max-width:1000px){.gm-grid{grid-template-columns:1fr}}
      `}</style>

      {/* TOP BAR */}
      <div style={{ borderBottom: `1px solid ${PALETTE.borderAlt}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: PALETTE.bg, position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: PALETTE.accent, letterSpacing: 5, lineHeight: 1 }}>WARBOUND — GM MODE</div>
          <div style={{ fontSize: 8, color: PALETTE.dim, letterSpacing: 3, marginTop: 3 }}>ENCOUNTER TRACKER · NPC DATABASE {isDemo && "· DEMO"}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saveMsg && <div style={{ fontSize: 10, color: saveMsg.startsWith("✓") ? PALETTE.hpGreen : PALETTE.danger, letterSpacing: 2 }}>{saveMsg}</div>}
          <input value={missionName} onChange={e => setMissionName(e.target.value)} placeholder="MISSION NAME" style={{ ...inputStyle, width: 200, fontSize: 10, fontFamily: "'Orbitron',sans-serif", letterSpacing: 2 }} />
          <button onClick={newSession} style={{ background: "transparent", border: `1px solid ${PALETTE.borderAlt}`, color: PALETTE.text, padding: "7px 12px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>+ NEW</button>
          <button onClick={saveSession} style={{ background: PALETTE.accent, border: "none", color: "#000", padding: "7px 14px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 2, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>↑ SAVE</button>
          {onSwitchToPlayer && <button onClick={onSwitchToPlayer} style={{ background: "transparent", border: `1px solid ${PALETTE.def}`, color: PALETTE.def, padding: "7px 12px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>PLAYER</button>}
          <button onClick={onLogout} style={{ background: "transparent", border: `1px solid ${PALETTE.borderAlt}`, color: PALETTE.text, padding: "7px 12px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>LOGOUT</button>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 1500, margin: "0 auto" }}>
        {/* Encounter summary */}
        <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, borderLeft: `3px solid ${PALETTE.accent}`, padding: "10px 16px", marginBottom: 14, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, borderRadius: 2 }}>
          <SummaryStat label="ACTIVE UNITS" value={encounterStats.total} />
          <SummaryStat label="HP TOTAL" value={`${encounterStats.hpSum}/${encounterStats.hpMaxSum}`} />
          <SummaryStat label="AVG HP%" value={`${encounterStats.pct}%`} color={encounterStats.pct > 50 ? PALETTE.hpGreen : encounterStats.pct > 25 ? PALETTE.hpAmber : PALETTE.danger} />
          <SummaryStat label="KRITIS" value={encounterStats.kritis} color={PALETTE.hpAmber} />
          <SummaryStat label="RUSAK" value={encounterStats.rusak} color="#f97316" />
          <SummaryStat label="HANCUR" value={encounterStats.hancur} color={PALETTE.danger} />
        </div>

        <div className="gm-grid">
          {/* LEFT — NPC DATABASE */}
          <div style={{ ...boxStyle, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <SectionLabel>NPC DATABASE · {allNpcs.length}{npcLoading ? " (loading...)" : ""}</SectionLabel>
              <button onClick={() => setShowCreator(true)} style={{ background: PALETTE.accent, border: "none", color: "#000", padding: "5px 10px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 1, cursor: "pointer", fontSize: 9, borderRadius: 2 }}>+ CUSTOM NPC</button>
            </div>
            {poolSource === "highlight" && !isDemo && (
              <div style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.accentDim}`, padding: "6px 8px", marginBottom: 8, fontSize: 9, color: PALETTE.accent, letterSpacing: 1, borderRadius: 2, lineHeight: 1.4 }}>
                ⚠ NPC pool belum di-seed. Hanya {NPC_HIGHLIGHT_POOL.length} NPC sample tersedia. Jalankan <code style={{ color: PALETTE.textBright }}>warbound_npc_seed.sql</code> di Supabase untuk dapatkan 280 NPC.
              </div>
            )}
            {/* Filters */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              <input value={filter.q} onChange={e => setFilter(f => ({ ...f, q: e.target.value }))} placeholder="🔍 Cari nama atau ID..." style={{ ...inputStyle, fontSize: 10 }} />
              <select value={filter.arketype} onChange={e => setFilter(f => ({ ...f, arketype: e.target.value }))} style={{ ...selectStyle, fontSize: 9 }}>
                {arketypes.map(a => <option key={a}>{a}</option>)}
              </select>
              <select value={filter.fraksi} onChange={e => setFilter(f => ({ ...f, fraksi: e.target.value }))} style={{ ...selectStyle, fontSize: 9 }}>
                {fraksiList.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
              <select value={filter.tier} onChange={e => setFilter(f => ({ ...f, tier: e.target.value === "All" ? "All" : parseInt(e.target.value, 10) }))} style={{ ...selectStyle, fontSize: 9 }}>
                {tiers.map(t => <option key={t} value={t}>{t === "All" ? "All Tiers" : `TIER ${t}`}</option>)}
              </select>
              <select value={filter.chassis} onChange={e => setFilter(f => ({ ...f, chassis: e.target.value }))} style={{ ...selectStyle, fontSize: 9 }}>
                {chassises.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={filter.source} onChange={e => setFilter(f => ({ ...f, source: e.target.value }))} style={{ ...selectStyle, fontSize: 9 }}>
                <option value="All">All Sources</option>
                <option value="pool">Pool Only</option>
                <option value="custom">Custom Only</option>
              </select>
            </div>
            <div style={{ fontSize: 9, color: PALETTE.dim2, marginBottom: 8, letterSpacing: 1 }}>{filtered.length} match{filtered.length !== 1 ? "es" : ""}</div>
            {/* NPC list */}
            <div style={{ maxHeight: 500, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {filtered.slice(0, 100).map((npc, i) => (
                <div key={npc.__row_id || npc.id || i} style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, borderLeft: `3px solid ${npc.__custom ? PALETTE.accent : tierColor(npc.tier)}`, padding: "6px 8px", borderRadius: 2, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setShowNpcDetail(npc)}>
                    <div style={{ fontSize: 10, color: PALETTE.textBright, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 1, display: "flex", alignItems: "center", gap: 6 }}>
                      {npc.name}
                      {npc.__custom && <span style={{ fontSize: 7, background: PALETTE.accent, color: "#000", padding: "1px 4px", letterSpacing: 1, borderRadius: 1 }}>CUSTOM</span>}
                    </div>
                    <div style={{ fontSize: 8, color: PALETTE.dim2, letterSpacing: 1, marginTop: 1 }}>
                      {npc.id} · {npc.arketype} · T{npc.tier}
                    </div>
                    <div style={{ fontSize: 8, color: PALETTE.dim2, letterSpacing: 1, marginTop: 1 }}>
                      HP {npc.hp} · DEF {npc.def} · {npc.move} · {npc.weapon}
                    </div>
                  </div>
                  <button onClick={() => addNpc(npc)} style={{ background: PALETTE.accent, border: "none", color: "#000", padding: "5px 9px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 1, cursor: "pointer", fontSize: 9, borderRadius: 2, flexShrink: 0 }}>+ ADD</button>
                  <button onClick={() => { const c = prompt(`Berapa ${npc.name}?`, "3"); if (c) addMultiple(npc, c); }} style={{ background: "transparent", border: `1px solid ${PALETTE.accent}`, color: PALETTE.accent, padding: "5px 7px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, cursor: "pointer", fontSize: 9, borderRadius: 2, flexShrink: 0 }}>×N</button>
                  {npc.__custom && <button onClick={() => deleteCustomNpc(npc)} style={{ background: "transparent", border: `1px solid ${PALETTE.danger}`, color: PALETTE.danger, padding: "5px 7px", cursor: "pointer", fontSize: 9, borderRadius: 2, flexShrink: 0 }}>✕</button>}
                </div>
              ))}
              {filtered.length > 100 && <div style={{ fontSize: 9, color: PALETTE.dim2, textAlign: "center", padding: 8 }}>… +{filtered.length - 100} more. Gunakan filter untuk mempersempit.</div>}
              {filtered.length === 0 && !npcLoading && <div style={{ fontSize: 10, color: PALETTE.dim2, textAlign: "center", padding: 20, letterSpacing: 1 }}>Tidak ada NPC match. Coba ubah filter atau buat Custom NPC.</div>}
            </div>
          </div>

          {/* RIGHT — ENCOUNTER ROSTER */}
          <div>
            <div style={{ ...boxStyle, padding: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <SectionLabel>◆ ENCOUNTER — UNIT AKTIF</SectionLabel>
                {activeUnits.length > 0 && <button onClick={() => confirm("Hapus semua unit?") && setActiveUnits([])} style={{ background: "transparent", border: `1px solid ${PALETTE.danger}`, color: PALETTE.danger, padding: "4px 10px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, cursor: "pointer", fontSize: 9, borderRadius: 2 }}>CLEAR ALL</button>}
              </div>
              {activeUnits.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: PALETTE.dim2, fontSize: 11, letterSpacing: 1 }}>TIDAK ADA UNIT AKTIF.<br />PILIH NPC DARI DATABASE UNTUK MULAI ENCOUNTER.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
                  {activeUnits.map(u => <EncounterUnit key={u.uid} unit={u} onRemove={() => removeUnit(u.uid)} onUpdate={patch => updateUnit(u.uid, patch)} />)}
                </div>
              )}
            </div>

            {/* Quick Roll Tables */}
            <div style={{ ...boxStyle, padding: 14 }}>
              <SectionLabel>QUICK ROLL — RANDOM ENCOUNTER (1d20)</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                {QUICK_ROLL_TABLES.map(t => (
                  <button key={t.name} onClick={() => rollOnTable(t)} style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, color: PALETTE.text, padding: "10px 8px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, cursor: "pointer", fontSize: 9, borderRadius: 2, textAlign: "left", fontWeight: 700 }}>
                    <span style={{ color: PALETTE.accent, marginRight: 6 }}>{t.icon}</span>{t.name}
                  </button>
                ))}
              </div>
              {quickRoll && (
                <div style={{ marginTop: 12, background: PALETTE.surface2, border: `1px solid ${PALETTE.accent}`, borderLeft: `3px solid ${PALETTE.accent}`, padding: 12, borderRadius: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 9, color: PALETTE.dim2, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{quickRoll.tableName}</span>
                    <span style={{ fontSize: 22, fontFamily: "'Orbitron',sans-serif", fontWeight: 900, color: PALETTE.accent }}>⚄ {quickRoll.roll}</span>
                  </div>
                  <div style={{ fontSize: 10, color: PALETTE.textBright, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                    [{quickRoll.entry.range}] {quickRoll.entry.desc}
                  </div>
                  <div style={{ fontSize: 10, color: PALETTE.accent, marginBottom: 3 }}>→ {quickRoll.entry.rec} <span style={{ color: PALETTE.dim2 }}>({quickRoll.entry.count})</span></div>
                  <div style={{ fontSize: 9, color: PALETTE.text, lineHeight: 1.4, fontStyle: "italic" }}>{quickRoll.entry.note}</div>
                </div>
              )}
            </div>

            {/* Session list */}
            {sessions.length > 0 && (
              <div style={{ ...boxStyle, padding: 14, marginTop: 14 }}>
                <SectionLabel>SAVED SESSIONS</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, padding: "6px 10px", borderRadius: 2, cursor: "pointer" }} onClick={() => loadSession(s)}>
                      <div>
                        <div style={{ fontSize: 10, color: PALETTE.textBright, letterSpacing: 1, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{s.mission_name}</div>
                        <div style={{ fontSize: 8, color: PALETTE.dim2, letterSpacing: 1 }}>{new Date(s.updated_at).toLocaleString()} · {(s.data?.activeUnits || []).length} units</div>
                      </div>
                      <span style={{ color: PALETTE.accent, fontSize: 10 }}>LOAD →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Party Monitor (realtime) */}
            {!isDemo && (
              <div style={{ ...boxStyle, padding: 14, marginTop: 14, borderLeft: `3px solid ${PALETTE.def}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <SectionLabel>◉ PARTY MONITOR · REALTIME</SectionLabel>
                  <button onClick={() => setMonitorActive(v => !v)} style={{ background: monitorActive ? PALETTE.def : "transparent", border: `1px solid ${PALETTE.def}`, color: monitorActive ? "#000" : PALETTE.def, padding: "5px 10px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 1, cursor: "pointer", fontSize: 9, borderRadius: 2 }}>
                    {monitorActive ? "● LIVE" : "○ START"}
                  </button>
                </div>
                {!monitorActive ? (
                  <div style={{ fontSize: 10, color: PALETTE.dim2, lineHeight: 1.4, letterSpacing: 1 }}>
                    Aktifkan monitor untuk melihat HP & status pilot secara live saat player meng-update char sheet mereka. Menggunakan Supabase Realtime subscription.
                  </div>
                ) : partyChars.length === 0 ? (
                  <div style={{ fontSize: 10, color: PALETTE.dim2, textAlign: "center", padding: 20, letterSpacing: 1 }}>
                    MENUNGGU UPDATE PLAYER... <br />
                    <span style={{ fontSize: 8, color: PALETTE.dim }}>(Pastikan RLS policy memperbolehkan GM membaca karakter, atau player save sheet untuk trigger update)</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 400, overflowY: "auto" }}>
                    {partyChars.map(c => <PartyMonitorRow key={c.id} char={c} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom NPC Creator modal */}
      {showCreator && (
        <CustomNpcCreator
          onClose={() => setShowCreator(false)}
          onSave={saveCustomNpc}
        />
      )}

      {/* NPC detail modal */}
      {showNpcDetail && (
        <div onClick={() => setShowNpcDetail(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: "100%", background: PALETTE.surface, border: `1px solid ${PALETTE.accent}`, borderLeft: `3px solid ${PALETTE.accent}`, padding: 24, borderRadius: 2, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, color: PALETTE.textBright, fontFamily: "'Orbitron',sans-serif", fontWeight: 900, letterSpacing: 2 }}>{showNpcDetail.name}</div>
                <div style={{ fontSize: 10, color: PALETTE.accent, letterSpacing: 2, marginTop: 2 }}>{showNpcDetail.id} · TIER {showNpcDetail.tier}</div>
              </div>
              <button onClick={() => setShowNpcDetail(null)} style={{ background: "transparent", border: "none", color: PALETTE.dim2, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <KVPair label="Arketipe" value={showNpcDetail.arketype} />
              <KVPair label="Fraksi" value={showNpcDetail.fraksi} />
              <KVPair label="Lokasi" value={showNpcDetail.lokasi} />
              <KVPair label="Chassis" value={showNpcDetail.chassis} />
              <KVPair label="HP" value={showNpcDetail.hp} color={PALETTE.hpGreen} />
              <KVPair label="DEF" value={showNpcDetail.def} color={PALETTE.def} />
              <KVPair label="MOVE" value={showNpcDetail.move} color={PALETTE.move} />
              <KVPair label="AP" value={showNpcDetail.ap} />
              <KVPair label="Weapon" value={showNpcDetail.weapon} />
              <KVPair label="Damage" value={showNpcDetail.damage} color={PALETTE.danger} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ ...labelStyle, marginBottom: 4 }}>SPECIAL RULE</div>
              <div style={{ fontSize: 10, color: PALETTE.text, lineHeight: 1.5, background: PALETTE.surface2, padding: 10, border: `1px solid ${PALETTE.borderAlt}`, borderRadius: 2 }}>{showNpcDetail.special}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...labelStyle, marginBottom: 4 }}>GM NOTES</div>
              <div style={{ fontSize: 10, color: PALETTE.dim, lineHeight: 1.5, fontStyle: "italic" }}>{showNpcDetail.notes}</div>
            </div>
            <button onClick={() => { addNpc(showNpcDetail); setShowNpcDetail(null); }} style={{ width: "100%", background: PALETTE.accent, border: "none", color: "#000", padding: "10px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 3, cursor: "pointer", fontSize: 11, borderRadius: 2 }}>+ ADD TO ENCOUNTER</button>
          </div>
        </div>
      )}
    </div>
  );
}

function tierColor(t) {
  return t === 2 ? "#dc2626" : t === 1 ? "#f59e0b" : PALETTE.dim2;
}

function SummaryStat({ label, value, color = PALETTE.textBright }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 8, color: PALETTE.dim, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function KVPair({ label, value, color = PALETTE.text }) {
  return (
    <div style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, padding: "6px 10px", borderRadius: 2 }}>
      <div style={{ fontSize: 8, color: PALETTE.dim, letterSpacing: 1.5, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 11, color, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, marginTop: 2, letterSpacing: 1 }}>{value || "—"}</div>
    </div>
  );
}

function EncounterUnit({ unit, onRemove, onUpdate }) {
  const { npc, hpNow } = unit;
  const pct = (hpNow / npc.hp) * 100;
  const col = hpNow <= 0 ? PALETTE.dim2 : pct > 50 ? PALETTE.hpGreen : pct > 25 ? PALETTE.hpAmber : PALETTE.danger;
  const statusKeys = ["BURN", "STUN", "SHOCK", "EXPOSED"];

  const status = hpNow <= 0 ? "HANCUR" : pct <= 25 ? "KRITIS" : pct <= 50 ? "RUSAK" : "AKTIF";

  return (
    <div style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, borderLeft: `3px solid ${col}`, padding: 8, borderRadius: 2, opacity: hpNow <= 0 ? 0.5 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: PALETTE.textBright, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 1 }}>{npc.name}</div>
          <div style={{ fontSize: 8, color: PALETTE.dim2, letterSpacing: 1 }}>
            {npc.id} · T{npc.tier} · {npc.weapon} · <span style={{ color: PALETTE.danger }}>{npc.damage}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: col, letterSpacing: 2, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{status}</span>
          <button onClick={onRemove} style={{ background: "transparent", border: "none", color: PALETTE.dim2, cursor: "pointer", fontSize: 12, padding: 2 }}>✕</button>
        </div>
      </div>
      {/* HP bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ flex: 1 }}><HpBar current={Math.max(0, hpNow)} max={npc.hp} color={col} /></div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: col, fontWeight: 700, minWidth: 60, textAlign: "right" }}>{hpNow}/{npc.hp}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
        {[-10, -5, -1, 1, 5].map(d => (
          <button key={d} onClick={() => onUpdate({ hpNow: Math.max(-999, Math.min(npc.hp, hpNow + d)) })} style={{ ...btnStyle, width: "auto", height: 22, padding: "0 7px", fontSize: 9, color: d < 0 ? PALETTE.danger : PALETTE.hpGreen }}>{d > 0 ? `+${d}` : d}</button>
        ))}
        <button onClick={() => onUpdate({ hpNow: npc.hp })} style={{ ...btnStyle, width: "auto", height: 22, padding: "0 8px", fontSize: 9, color: PALETTE.accent, letterSpacing: 1 }}>RST</button>
        <span style={{ width: 1, height: 18, background: PALETTE.borderAlt, margin: "0 2px" }} />
        {statusKeys.map(s => (
          <button key={s} onClick={() => onUpdate({ status: { ...unit.status, [s]: !unit.status[s] } })} style={{ background: unit.status[s] ? "rgba(220,38,38,0.15)" : "transparent", border: `1px solid ${unit.status[s] ? PALETTE.danger : PALETTE.borderAlt}`, color: unit.status[s] ? PALETTE.danger : PALETTE.dim2, padding: "3px 6px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, cursor: "pointer", fontSize: 8, borderRadius: 2, fontWeight: 700 }}>{s}</button>
        ))}
      </div>
      {unit.status && Object.values(unit.status).some(Boolean) && (
        <div style={{ fontSize: 9, color: PALETTE.dim2, marginTop: 4, lineHeight: 1.3, fontStyle: "italic" }}>
          {npc.special?.slice(0, 120)}{npc.special?.length > 120 ? "..." : ""}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PARTY MONITOR ROW — single player char, realtime HP/status view
// ============================================================

function PartyMonitorRow({ char }) {
  const d = char.data || {};
  const chassis = d.chassis || "HEAVY";
  const cd = CHASSIS_DATA[chassis] || CHASSIS_DATA.HEAVY;
  const jobData = JOBS[d.job] || JOBS["—"];
  const armor = ARMORS.find(a => a.name === d.armor) || ARMORS[0];
  const leg = LEGS.find(l => l.name === d.leg) || LEGS[0];
  const thruster = THRUSTERS.find(t => t.name === d.thruster) || THRUSTERS[0];

  const hasJob = d.job && d.job !== "—";
  const hpMax = hasJob ? Math.floor(cd.BASE_HP + ((jobData.VIT || 0) + (jobData.AGI || 0)) * cd.HP_MULT) : cd.BASE_HP;
  const hpNow = d.hpCurrent === null || d.hpCurrent === undefined ? hpMax : d.hpCurrent;
  const pct = (hpNow / hpMax) * 100;
  const hpCol = pct > 50 ? PALETTE.hpGreen : pct > 25 ? PALETTE.hpAmber : PALETTE.danger;

  const orgMax = 12 + (jobData.VIT || 0);
  const orgNow = Math.max(0, orgMax - (d.pilotDamage || 0));
  const orgPct = (orgNow / orgMax) * 100;
  const orgCol = orgPct > 50 ? PALETTE.hpGreen : orgPct > 25 ? PALETTE.hpAmber : PALETTE.danger;

  const defTotal = cd.BASE_DEF + (hasJob ? Math.floor((jobData.VIT || 0) / 3) : 0) + (armor.defBonus || 0) + (leg.defBonus || 0);
  const moveTotal = cd.BASE_MOVE + (hasJob ? Math.floor((jobData.AGI || 0) / 2) : 0) + (leg.moveBonus || 0) + (thruster.moveBonus || 0);

  const statuses = Object.entries(d.statuses || {}).filter(([, v]) => v).map(([k]) => k);
  const pilotStatuses = Object.entries(d.pilotStatuses || {}).filter(([, v]) => v).map(([k]) => k);
  const plague = d.plague || 0;
  const hunger = d.hungerLv || 0;

  const age = Math.floor((Date.now() - new Date(char.updated_at).getTime()) / 1000);
  const ageLabel = age < 60 ? `${age}s` : age < 3600 ? `${Math.floor(age/60)}m` : age < 86400 ? `${Math.floor(age/3600)}h` : `${Math.floor(age/86400)}d`;

  return (
    <div style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.borderAlt}`, borderLeft: `3px solid ${hpCol}`, padding: 8, borderRadius: 2 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
          {d.portraitUrl && <img src={d.portraitUrl} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 2, border: `1px solid ${PALETTE.borderAlt}`, flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: PALETTE.textBright, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.pilotName || char.name || "Unnamed"}</div>
            <div style={{ fontSize: 8, color: PALETTE.dim2, letterSpacing: 1 }}>SCAR-{chassis} · {d.job || "NO JOB"} · T{d.tier || "0"}</div>
          </div>
        </div>
        <div style={{ fontSize: 8, color: PALETTE.dim2, letterSpacing: 1, textAlign: "right", flexShrink: 0 }}>
          <div>{ageLabel} ago</div>
        </div>
      </div>
      {/* HP SCAR */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
        <div style={{ width: 40, fontSize: 8, color: PALETTE.dim2, letterSpacing: 1, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>SCAR</div>
        <div style={{ flex: 1 }}><HpBar current={Math.max(0, hpNow)} max={hpMax} color={hpCol} /></div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: hpCol, fontWeight: 700, minWidth: 54, textAlign: "right" }}>{hpNow}/{hpMax}</div>
      </div>
      {/* HP Organik */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div style={{ width: 40, fontSize: 8, color: PALETTE.dim2, letterSpacing: 1, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>PILOT</div>
        <div style={{ flex: 1 }}><HpBar current={orgNow} max={orgMax} color={orgCol} /></div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: orgCol, fontWeight: 700, minWidth: 54, textAlign: "right" }}>{orgNow}/{orgMax}</div>
      </div>
      {/* Stats strip */}
      <div style={{ display: "flex", gap: 10, fontSize: 9, color: PALETTE.dim2, letterSpacing: 1, marginBottom: 4 }}>
        <span>DEF <span style={{ color: PALETTE.def, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{defTotal}</span></span>
        <span>MOVE <span style={{ color: PALETTE.move, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{moveTotal}</span></span>
        {plague > 0 && <span>PLAGUE <span style={{ color: PALETTE.danger, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>{plague}</span></span>}
        {hunger > 0 && <span>HUNGER <span style={{ color: HUNGER_LEVELS[hunger]?.color || PALETTE.danger, fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}>L{hunger}</span></span>}
      </div>
      {/* Status effects */}
      {(statuses.length > 0 || pilotStatuses.length > 0) && (
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {[...pilotStatuses, ...statuses].map(s => (
            <span key={s} style={{ fontSize: 7, background: "rgba(220,38,38,0.15)", border: `1px solid ${PALETTE.danger}`, color: PALETTE.danger, padding: "1px 5px", letterSpacing: 1, fontFamily: "'Orbitron',sans-serif", fontWeight: 700, borderRadius: 1 }}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CUSTOM NPC CREATOR — GM bikin NPC dari variable sistem
// ============================================================

function CustomNpcCreator({ onClose, onSave }) {
  const [form, setForm] = useState({
    id: `CUSTOM_${Date.now().toString(36).toUpperCase()}`,
    name: "",
    arketype: "Grunt Garis Depan",
    lokasi: "",
    fraksi: "Independen",
    tier: 0,
    chassis: "SCAR Medium Standar",
    basisJob: "—",
    weapon: "AR-7 Rifle",
    armor: "EMPTY",
    leg: "Basic Legs",
    // derived fields (editable):
    hp: 50,
    def: 8,
    move: "10m",
    ap: 0,
    damage: "1d6",
    special: "",
    notes: "",
  });

  const arketypeOptions = [
    "Non-Combatant / Sipil", "Operator Utilitas", "Grunt Garis Depan",
    "Striker Agresif", "Teknisi / Hacker", "Medis Lapangan",
    "Penembak Jitu / Overwatch", "Artileri Berat", "Komandan Lapangan",
    "Bodyguard Elite", "Negosiator / Broker", "Informan / Mata-Mata",
    "Veteran Bertempur", "Pilot Ace",
  ];

  const chassisOptions = [
    "Tanpa SCAR", "SCAR Light", "SCAR Light Tier 1", "SCAR Light Tier 2",
    "SCAR Medium Sipil", "SCAR Medium Standar", "SCAR Medium Tier 1", "SCAR Medium Tier 2",
    "SCAR Heavy Standar", "SCAR Heavy Artileri", "SCAR Heavy Tier 1", "SCAR Heavy/Medium Tier 2",
  ];

  const fraksiOptions = [
    "Pacific Union", "SAU", "Oceanian", "Arbrau", "Atlantis",
    "Middle-East", "Blue Flame", "Independen", "Netral", "The Submerged"
  ];

  // Auto-derive stats saat pilih job template
  const applyJobTemplate = (jobKey) => {
    const j = JOBS[jobKey];
    if (!j || jobKey === "—") { setForm(f => ({ ...f, basisJob: jobKey })); return; }
    const hp = Math.floor(50 + (j.VIT + j.AGI) * 2);
    const def = 8 + Math.floor(j.VIT / 3);
    const moveNum = 10 + Math.floor(j.AGI / 2);
    setForm(f => ({ ...f, basisJob: jobKey, hp, def, move: `${moveNum}m` }));
  };

  // Auto-derive damage saat pilih weapon
  const applyWeapon = (wname) => {
    const w = WEAPONS.find(x => x.name === wname);
    setForm(f => ({ ...f, weapon: wname, damage: w ? `${w.dmg}${w.tags && w.tags !== "—" ? ` (${w.tags})` : ""}` : f.damage }));
  };

  // Auto-tweak def saat pilih armor
  const applyArmor = (aname) => {
    const a = ARMORS.find(x => x.name === aname);
    if (!a || aname === "EMPTY") { setForm(f => ({ ...f, armor: aname })); return; }
    const base = 8 + (JOBS[form.basisJob] ? Math.floor(JOBS[form.basisJob].VIT / 3) : 0);
    setForm(f => ({ ...f, armor: aname, def: base + a.defBonus }));
  };

  const canSave = form.name.trim() && form.id.trim() && form.hp > 0;

  const save = () => {
    if (!canSave) return;
    const npc = {
      id: form.id.trim(),
      name: form.name.trim(),
      arketype: form.arketype,
      lokasi: form.lokasi || "—",
      fraksi: form.fraksi,
      hp: parseInt(form.hp, 10) || 10,
      def: parseInt(form.def, 10) || 0,
      move: form.move,
      ap: parseInt(form.ap, 10) || 0,
      weapon: form.weapon === "EMPTY" ? "" : form.weapon,
      damage: form.damage,
      special: form.special || "—",
      notes: form.notes || "—",
      tier: parseInt(form.tier, 10) || 0,
      chassis: form.chassis,
    };
    onSave(npc);
  };

  const fieldLabel = { ...labelStyle, marginBottom: 3 };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 720, width: "100%", background: PALETTE.surface, border: `1px solid ${PALETTE.accent}`, borderLeft: `3px solid ${PALETTE.accent}`, padding: 24, borderRadius: 2, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 18, color: PALETTE.textBright, fontFamily: "'Orbitron',sans-serif", fontWeight: 900, letterSpacing: 3 }}>+ CREATE CUSTOM NPC</div>
            <div style={{ fontSize: 9, color: PALETTE.dim, letterSpacing: 3, marginTop: 3 }}>GUNAKAN VARIABEL SISTEM · JOB / WEAPON / ARMOR</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: PALETTE.dim2, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {/* Identity */}
        <SectionLabel>IDENTITY</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <div style={fieldLabel}>ID VARIAN *</div>
            <input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value.toUpperCase().replace(/\s+/g, "_") }))} style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>NAMA NPC *</div>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="contoh: Crimson Reaper" style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>ARKETIPE</div>
            <select value={form.arketype} onChange={e => setForm(f => ({ ...f, arketype: e.target.value }))} style={selectStyle}>
              {arketypeOptions.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div style={fieldLabel}>FRAKSI</div>
            <select value={form.fraksi} onChange={e => setForm(f => ({ ...f, fraksi: e.target.value }))} style={selectStyle}>
              {fraksiOptions.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div style={fieldLabel}>LOKASI</div>
            <input value={form.lokasi} onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))} placeholder="contoh: Neo-Jakarta" style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>TIER</div>
            <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: parseInt(e.target.value, 10) }))} style={selectStyle}>
              {[0, 1, 2].map(t => <option key={t} value={t}>TIER {t}</option>)}
            </select>
          </div>
        </div>

        {/* Equipment dari variabel sistem */}
        <SectionLabel>EQUIPMENT · AUTO-DERIVE</SectionLabel>
        <div style={{ background: PALETTE.surface2, border: `1px solid ${PALETTE.accentDim}`, padding: 8, marginBottom: 10, fontSize: 9, color: PALETTE.dim2, letterSpacing: 1, lineHeight: 1.5, borderRadius: 2 }}>
          Pilih JOB/WEAPON/ARMOR di bawah → stat HP/DEF/MOVE/DAMAGE auto-terisi dari sistem. Kamu bisa override manual di kolom stat di bawahnya.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <div style={fieldLabel}>CHASSIS</div>
            <select value={form.chassis} onChange={e => setForm(f => ({ ...f, chassis: e.target.value }))} style={selectStyle}>
              {chassisOptions.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <div style={fieldLabel}>JOB TEMPLATE</div>
            <select value={form.basisJob} onChange={e => applyJobTemplate(e.target.value)} style={selectStyle}>
              {Object.keys(JOBS).map(j => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <div style={fieldLabel}>WEAPON</div>
            <select value={form.weapon} onChange={e => applyWeapon(e.target.value)} style={selectStyle}>
              {WEAPONS.map(w => <option key={w.name}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <div style={fieldLabel}>ARMOR</div>
            <select value={form.armor} onChange={e => applyArmor(e.target.value)} style={selectStyle}>
              {ARMORS.map(a => <option key={a.name}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <div style={fieldLabel}>LEG MODULE</div>
            <select value={form.leg} onChange={e => setForm(f => ({ ...f, leg: e.target.value }))} style={selectStyle}>
              {LEGS.map(l => <option key={l.name}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <div style={fieldLabel}>AP (ARMOR PEN)</div>
            <input type="number" min={0} max={5} value={form.ap} onChange={e => setForm(f => ({ ...f, ap: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        {/* Stats */}
        <SectionLabel>STATS · OVERRIDE MANUAL</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          <div>
            <div style={fieldLabel}>HP *</div>
            <input type="number" min={1} value={form.hp} onChange={e => setForm(f => ({ ...f, hp: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>DEF</div>
            <input type="number" min={0} value={form.def} onChange={e => setForm(f => ({ ...f, def: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>MOVE</div>
            <input value={form.move} onChange={e => setForm(f => ({ ...f, move: e.target.value }))} placeholder="10m" style={inputStyle} />
          </div>
          <div>
            <div style={fieldLabel}>DAMAGE</div>
            <input value={form.damage} onChange={e => setForm(f => ({ ...f, damage: e.target.value }))} placeholder="1d6" style={inputStyle} />
          </div>
        </div>

        {/* Special + notes */}
        <SectionLabel>SPECIAL RULE · GM NOTES</SectionLabel>
        <div style={{ marginBottom: 10 }}>
          <div style={fieldLabel}>SPECIAL ARKETIPE</div>
          <textarea value={form.special} onChange={e => setForm(f => ({ ...f, special: e.target.value }))} placeholder="contoh: Cover Formation: 2+ unit berdampingan → Cover (+2 DEF) tanpa objek fisik." style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={fieldLabel}>GM NOTES</div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Tactical notes, lore hooks, dll..." style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: "transparent", border: `1px solid ${PALETTE.borderAlt}`, color: PALETTE.text, padding: "10px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 2, cursor: "pointer", fontSize: 10, borderRadius: 2 }}>CANCEL</button>
          <button onClick={save} disabled={!canSave} style={{ flex: 2, background: canSave ? PALETTE.accent : PALETTE.dim, border: "none", color: "#000", padding: "10px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 3, cursor: canSave ? "pointer" : "not-allowed", fontSize: 10, borderRadius: 2, opacity: canSave ? 1 : 0.5 }}>{canSave ? "+ SAVE NPC" : "NAMA & HP WAJIB"}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROOT APP — routing between Setup → Auth → Roster/GM → Sheet
// ============================================================

export default function App() {
  const [screen, setScreen] = useState("setup"); // setup | auth | roster | sheet | gm
  const [config, setConfig] = useState(null);
  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("player"); // 'player' | 'gm'
  const [chars, setChars] = useState([]);
  const [activeChar, setActiveChar] = useState(null);
  const isDemo = config?.mode === "local";

  const fetchRole = async (sb, userId) => {
    try {
      const { data } = await sb.from("warbound_profiles").select("role").eq("user_id", userId).maybeSingle();
      if (data?.role) { setRole(data.role); return data.role; }
      // If no profile row exists, create one as 'player' by default
      await sb.from("warbound_profiles").upsert({ user_id: userId, role: "player" });
      setRole("player");
      return "player";
    } catch (e) {
      setRole("player");
      return "player";
    }
  };

  const routeByRole = (r) => {
    if (r === "gm") setScreen("gm"); else setScreen("roster");
  };

  // boot: move to auth or demo roster
  useEffect(() => {
    if (!config) return;
    if (config.mode === "local") {
      // in demo mode, let user pick via dedicated screen
      setScreen("demoPick");
      return;
    }
    getSupabase(config.url, config.key).then(async (sb) => {
      setSupabase(sb);
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const r = await fetchRole(sb, session.user.id);
        routeByRole(r);
      } else {
        setScreen("auth");
      }
    });
  }, [config]);

  const loadChars = async () => {
    if (isDemo) return;
    if (!supabase || !user) return;
    const { data, error } = await supabase.from("warbound_characters").select("*").order("updated_at", { ascending: false });
    if (!error) setChars(data || []);
  };

  useEffect(() => { if (screen === "roster") loadChars(); }, [screen, user, supabase]);

  const handleSave = async ({ name, data }) => {
    if (isDemo) {
      setChars(prev => {
        if (activeChar) {
          return prev.map(c => c.id === activeChar.id ? { ...c, name, data, updated_at: new Date().toISOString() } : c);
        }
        const newChar = { id: Math.random().toString(36).slice(2), name, data, updated_at: new Date().toISOString() };
        setActiveChar(newChar);
        return [newChar, ...prev];
      });
      return;
    }
    if (activeChar?.id) {
      const { error } = await supabase.from("warbound_characters").update({ name, data, updated_at: new Date().toISOString() }).eq("id", activeChar.id);
      if (error) throw error;
    } else {
      const { data: inserted, error } = await supabase.from("warbound_characters").insert({ user_id: user.id, name, data }).select().single();
      if (error) throw error;
      setActiveChar(inserted);
    }
  };

  const doLogout = async () => {
    if (!isDemo && supabase) await supabase.auth.signOut();
    setUser(null); setActiveChar(null); setChars([]); setRole("player");
    setScreen(isDemo ? "setup" : "auth");
  };

  // ---------- ROUTING ----------
  if (screen === "setup") {
    return <SetupScreen onSetup={(cfg) => { setConfig(cfg); }} />;
  }
  if (screen === "demoPick") {
    // Demo role picker
    return (
      <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Share Tech Mono',monospace", color: PALETTE.text }}>
        <div style={{ maxWidth: 460, width: "100%", background: PALETTE.surface, border: `1px solid ${PALETTE.border}`, padding: 30, borderRadius: 2 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, color: PALETTE.accent, letterSpacing: 5, marginBottom: 3 }}>WARBOUND · DEMO</div>
          <div style={{ fontSize: 9, color: PALETTE.dim, letterSpacing: 3, marginBottom: 24 }}>PILIH MODE UNTUK DIUJI</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { setRole("player"); setScreen("roster"); }} style={{ background: PALETTE.accent, border: "none", color: "#000", padding: "14px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 3, cursor: "pointer", fontSize: 12, borderRadius: 2 }}>⧉ PLAYER MODE</button>
            <button onClick={() => { setRole("gm"); setScreen("gm"); }} style={{ background: "transparent", border: `1px solid ${PALETTE.def}`, color: PALETTE.def, padding: "14px", fontFamily: "'Orbitron',sans-serif", fontWeight: 700, letterSpacing: 3, cursor: "pointer", fontSize: 12, borderRadius: 2 }}>◈ GM MODE (ENCOUNTER TRACKER)</button>
            <button onClick={() => setScreen("setup")} style={{ background: "none", border: "none", color: PALETTE.dim2, padding: "8px", fontFamily: "'Orbitron',sans-serif", letterSpacing: 2, cursor: "pointer", fontSize: 9 }}>‹ BACK TO SETUP</button>
          </div>
        </div>
      </div>
    );
  }
  if (screen === "auth") {
    return <AuthScreen supabase={supabase} onAuth={async (u) => {
      setUser(u);
      const r = await fetchRole(supabase, u.id);
      routeByRole(r);
    }} onReset={() => { setConfig(null); setScreen("setup"); }} />;
  }
  if (screen === "gm") {
    return (
      <GMDashboard
        supabase={supabase}
        user={user}
        isDemo={isDemo}
        onLogout={doLogout}
        onSwitchToPlayer={role === "gm" ? () => setScreen("roster") : null}
      />
    );
  }
  if (screen === "roster") {
    return (
      <RosterScreen
        supabase={supabase}
        user={user}
        chars={chars}
        isDemo={isDemo}
        onLoad={(c) => { setActiveChar(c); setScreen("sheet"); }}
        onRefresh={(next) => { if (next) setChars(next); else loadChars(); }}
        onLogout={doLogout}
        onSwitchToGm={role === "gm" ? () => setScreen("gm") : null}
      />
    );
  }
  if (screen === "sheet") {
    return (
      <CharSheet
        charId={activeChar?.id}
        initialData={activeChar?.data}
        isDemo={isDemo}
        supabase={supabase}
        user={user}
        onSave={handleSave}
        onBack={() => { setActiveChar(null); setScreen("roster"); loadChars(); }}
      />
    );
  }
  return null;
}
