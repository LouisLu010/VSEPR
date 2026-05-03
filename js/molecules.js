// ============================================================
// Geometry helpers — unit direction vectors for VSEPR types
// ============================================================

const SQRT3 = Math.sqrt(3);
const SQRT3_2 = SQRT3 / 2;

function linearVectors() {
  return [[1, 0, 0], [-1, 0, 0]];
}

function trigonalPlanarVectors() {
  return [[1, 0, 0], [-0.5, SQRT3_2, 0], [-0.5, -SQRT3_2, 0]];
}

function tetrahedralVectors() {
  const d = 1 / SQRT3;
  return [[d, d, d], [d, -d, -d], [-d, d, -d], [-d, -d, d]];
}

function tbpEquatorialVectors() {
  return [[1, 0, 0], [-0.5, SQRT3_2, 0], [-0.5, -SQRT3_2, 0]];
}

function tbpAxialVectors() {
  return [[0, 0, 1], [0, 0, -1]];
}

function tbpVectors() {
  return [...tbpEquatorialVectors(), ...tbpAxialVectors()];
}

function octahedralVectors() {
  return [
    [1, 0, 0], [-1, 0, 0],
    [0, 1, 0], [0, -1, 0],
    [0, 0, 1], [0, 0, -1]
  ];
}

// Build molecule atom positions from geometry vectors
function buildMolecule(centralElem, vectors, bondLength, ligandElems, lonePairCount = 0) {
  const atoms = [{ elem: centralElem, pos: [0, 0, 0] }];
  const bonds = [];
  const lonePairVectors = [];

  const totalPositions = ligandElems.length + lonePairCount;

  for (let i = 0; i < ligandElems.length; i++) {
    const v = vectors[i];
    atoms.push({ elem: ligandElems[i], pos: [v[0] * bondLength, v[1] * bondLength, v[2] * bondLength] });
    bonds.push([0, atoms.length - 1, 1]); // [from, to, order]
  }

  for (let i = ligandElems.length; i < totalPositions; i++) {
    const v = vectors[i];
    // Store unit direction only — actual position computed at render time on atom surface
    lonePairVectors.push([v[0], v[1], v[2]]);
  }

  return { atoms, bonds, lonePairVectors };
}

// ============================================================
// CPK Atom colors & radii
// ============================================================

const ATOM_COLORS = {
  H:  0xFFFFFF, // white
  He: 0xD9FFFF,
  Li: 0xCC80FF,
  Be: 0xC2FF00,
  B:  0xFFB5B5,
  C:  0x404040, // dark grey
  N:  0x3050F8, // blue
  O:  0xFF0D0D, // red
  F:  0x90E050, // light green
  Ne: 0xB3E3F5,
  Na: 0xAB5CF2,
  Mg: 0x8AFF00,
  Al: 0xBFA6A6,
  Si: 0xF0C8A0,
  P:  0xFF8000, // orange
  S:  0xFFFF30, // yellow
  Cl: 0x1FF01F, // green
  Ar: 0x80D1E3,
  K:  0x8F40D4,
  Ca: 0x3DFF00,
  Br: 0xA62929, // dark red
  Kr: 0x5CB8D1,
  I:  0x940094, // dark purple
  Xe: 0x429EB0, // dark teal
};

const ATOM_RADII = {
  H:  0.32,
  C:  0.50,
  N:  0.46,
  O:  0.44,
  F:  0.40,
  Cl: 0.65,
  Br: 0.78,
  I:  0.90,
  P:  0.70,
  S:  0.64,
  Be: 0.55,
  B:  0.55,
  Xe: 0.82,
};

function getAtomColor(elem) {
  return ATOM_COLORS[elem] || 0x888888;
}

function getAtomRadius(elem) {
  return ATOM_RADII[elem] || 0.5;
}

// ============================================================
// Molecule definitions
// ============================================================

const BOND_L = 2.0; // standard bond length in scene units

const MOLECULES = [];

// --- sp - Linear (180°) ---

(function() {
  const vecs = linearVectors();

  MOLECULES.push({
    id: 'becl2', group: 'sp-linear',
    ...buildMolecule('Be', vecs, BOND_L, ['Cl', 'Cl']),
    name: '氯化铍', nameEN: 'Beryllium chloride', formula: 'BeCl₂',
    charge: '',
    vsepr: { formula: 'AX₂', stericNumber: 2, electronGeometry: '直线形', electronGeometryEN: 'Linear',
             molecularGeometry: '直线形', molecularGeometryEN: 'Linear',
             hybridization: 'sp', idealBondAngle: '180°', actualBondAngle: '180°' }
  });

  MOLECULES.push({
    id: 'co2', group: 'sp-linear',
    ...buildMolecule('C', vecs, BOND_L, ['O', 'O']),
    name: '二氧化碳', nameEN: 'Carbon dioxide', formula: 'CO₂',
    charge: '',
    bondOrders: [[0, 1, 2], [0, 2, 2]],
    vsepr: { formula: 'AX₂', stericNumber: 2, electronGeometry: '直线形', electronGeometryEN: 'Linear',
             molecularGeometry: '直线形', molecularGeometryEN: 'Linear',
             hybridization: 'sp', idealBondAngle: '180°', actualBondAngle: '180°' }
  });

  MOLECULES.push({
    id: 'c2h2', group: 'sp-linear',
    atoms: [
      { elem: 'C', pos: [-0.6, 0, 0] },
      { elem: 'C', pos: [0.6, 0, 0] },
      { elem: 'H', pos: [-1.66, 0, 0] },
      { elem: 'H', pos: [1.66, 0, 0] },
    ],
    bonds: [[0, 1, 3], [0, 2, 1], [1, 3, 1]],
    lonePairVectors: [],
    name: '乙炔', nameEN: 'Acetylene', formula: 'C₂H₂',
    charge: '',
    vsepr: { formula: 'AX₂ (per C)', stericNumber: 2, electronGeometry: '直线形', electronGeometryEN: 'Linear',
             molecularGeometry: '直线形', molecularGeometryEN: 'Linear',
             hybridization: 'sp', idealBondAngle: '180°', actualBondAngle: '180°' }
  });
})();

// --- sp² - Trigonal Planar (120°) ---

(function() {
  const vecs = trigonalPlanarVectors();

  MOLECULES.push({
    id: 'bf3', group: 'sp2-planar',
    ...buildMolecule('B', vecs, BOND_L, ['F', 'F', 'F']),
    name: '三氟化硼', nameEN: 'Boron trifluoride', formula: 'BF₃',
    charge: '',
    vsepr: { formula: 'AX₃', stericNumber: 3, electronGeometry: '平面三角形', electronGeometryEN: 'Trigonal planar',
             molecularGeometry: '平面三角形', molecularGeometryEN: 'Trigonal planar',
             hybridization: 'sp²', idealBondAngle: '120°', actualBondAngle: '120°' }
  });

  MOLECULES.push({
    id: 'so3', group: 'sp2-planar',
    ...buildMolecule('S', vecs, BOND_L, ['O', 'O', 'O']),
    name: '三氧化硫', nameEN: 'Sulfur trioxide', formula: 'SO₃',
    charge: '',
    vsepr: { formula: 'AX₃', stericNumber: 3, electronGeometry: '平面三角形', electronGeometryEN: 'Trigonal planar',
             molecularGeometry: '平面三角形', molecularGeometryEN: 'Trigonal planar',
             hybridization: 'sp²', idealBondAngle: '120°', actualBondAngle: '120°' }
  });

  MOLECULES.push({
    id: 'no3-', group: 'sp2-planar',
    ...buildMolecule('N', vecs, BOND_L, ['O', 'O', 'O']),
    name: '硝酸根', nameEN: 'Nitrate ion', formula: 'NO₃⁻',
    charge: '−1',
    vsepr: { formula: 'AX₃', stericNumber: 3, electronGeometry: '平面三角形', electronGeometryEN: 'Trigonal planar',
             molecularGeometry: '平面三角形', molecularGeometryEN: 'Trigonal planar',
             hybridization: 'sp²', idealBondAngle: '120°', actualBondAngle: '120°' }
  });

  MOLECULES.push({
    id: 'co32-', group: 'sp2-planar',
    ...buildMolecule('C', vecs, BOND_L, ['O', 'O', 'O']),
    name: '碳酸根', nameEN: 'Carbonate ion', formula: 'CO₃²⁻',
    charge: '−2',
    vsepr: { formula: 'AX₃', stericNumber: 3, electronGeometry: '平面三角形', electronGeometryEN: 'Trigonal planar',
             molecularGeometry: '平面三角形', molecularGeometryEN: 'Trigonal planar',
             hybridization: 'sp²', idealBondAngle: '120°', actualBondAngle: '120°' }
  });

  // sp² bent - SO₂ (AX₂E)
  MOLECULES.push({
    id: 'so2', group: 'sp2-bent',
    ...buildMolecule('S', vecs, BOND_L, ['O', 'O'], 1),
    name: '二氧化硫', nameEN: 'Sulfur dioxide', formula: 'SO₂',
    charge: '',
    vsepr: { formula: 'AX₂E', stericNumber: 3, electronGeometry: '平面三角形', electronGeometryEN: 'Trigonal planar',
             molecularGeometry: 'V形（弯曲形）', molecularGeometryEN: 'Bent',
             hybridization: 'sp²', idealBondAngle: '120°', actualBondAngle: '~119°' }
  });

  MOLECULES.push({
    id: 'o3', group: 'sp2-bent',
    ...buildMolecule('O', vecs, BOND_L, ['O', 'O'], 1),
    name: '臭氧', nameEN: 'Ozone', formula: 'O₃',
    charge: '',
    vsepr: { formula: 'AX₂E', stericNumber: 3, electronGeometry: '平面三角形', electronGeometryEN: 'Trigonal planar',
             molecularGeometry: 'V形（弯曲形）', molecularGeometryEN: 'Bent',
             hybridization: 'sp²', idealBondAngle: '120°', actualBondAngle: '~117°' }
  });

  // C₂H₄ - Ethylene
  MOLECULES.push({
    id: 'c2h4', group: 'sp2-planar',
    atoms: [
      { elem: 'C', pos: [-0.67, 0, 0] },
      { elem: 'C', pos: [0.67, 0, 0] },
      { elem: 'H', pos: [-1.20, 0.93, 0] },
      { elem: 'H', pos: [-1.20, -0.93, 0] },
      { elem: 'H', pos: [1.20, 0.93, 0] },
      { elem: 'H', pos: [1.20, -0.93, 0] },
    ],
    bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]],
    lonePairVectors: [],
    name: '乙烯', nameEN: 'Ethylene', formula: 'C₂H₄',
    charge: '',
    vsepr: { formula: 'AX₃ (per C)', stericNumber: 3, electronGeometry: '平面三角形', electronGeometryEN: 'Trigonal planar',
             molecularGeometry: '平面三角形', molecularGeometryEN: 'Trigonal planar',
             hybridization: 'sp²', idealBondAngle: '120°', actualBondAngle: '~117°' }
  });
})();

// --- sp³ - Tetrahedral & derivatives (109.5°) ---

(function() {
  const vecs = tetrahedralVectors();

  // AX₄ - Tetrahedral
  MOLECULES.push({
    id: 'ch4', group: 'sp3-tetrahedral',
    ...buildMolecule('C', vecs, BOND_L, ['H', 'H', 'H', 'H']),
    name: '甲烷', nameEN: 'Methane', formula: 'CH₄',
    charge: '',
    vsepr: { formula: 'AX₄', stericNumber: 4, electronGeometry: '四面体形', electronGeometryEN: 'Tetrahedral',
             molecularGeometry: '四面体形', molecularGeometryEN: 'Tetrahedral',
             hybridization: 'sp³', idealBondAngle: '109.5°', actualBondAngle: '109.5°' }
  });

  MOLECULES.push({
    id: 'nh4+', group: 'sp3-tetrahedral',
    ...buildMolecule('N', vecs, BOND_L, ['H', 'H', 'H', 'H']),
    name: '铵根', nameEN: 'Ammonium ion', formula: 'NH₄⁺',
    charge: '+1',
    vsepr: { formula: 'AX₄', stericNumber: 4, electronGeometry: '四面体形', electronGeometryEN: 'Tetrahedral',
             molecularGeometry: '四面体形', molecularGeometryEN: 'Tetrahedral',
             hybridization: 'sp³', idealBondAngle: '109.5°', actualBondAngle: '109.5°' }
  });

  MOLECULES.push({
    id: 'ccl4', group: 'sp3-tetrahedral',
    ...buildMolecule('C', vecs, BOND_L * 1.3, ['Cl', 'Cl', 'Cl', 'Cl']),
    name: '四氯化碳', nameEN: 'Carbon tetrachloride', formula: 'CCl₄',
    charge: '',
    vsepr: { formula: 'AX₄', stericNumber: 4, electronGeometry: '四面体形', electronGeometryEN: 'Tetrahedral',
             molecularGeometry: '四面体形', molecularGeometryEN: 'Tetrahedral',
             hybridization: 'sp³', idealBondAngle: '109.5°', actualBondAngle: '109.5°' }
  });

  MOLECULES.push({
    id: 'so42-', group: 'sp3-tetrahedral',
    ...buildMolecule('S', vecs, BOND_L, ['O', 'O', 'O', 'O']),
    name: '硫酸根', nameEN: 'Sulfate ion', formula: 'SO₄²⁻',
    charge: '−2',
    vsepr: { formula: 'AX₄', stericNumber: 4, electronGeometry: '四面体形', electronGeometryEN: 'Tetrahedral',
             molecularGeometry: '四面体形', molecularGeometryEN: 'Tetrahedral',
             hybridization: 'sp³', idealBondAngle: '109.5°', actualBondAngle: '109.5°' }
  });

  // AX₃E - Trigonal Pyramidal
  MOLECULES.push({
    id: 'nh3', group: 'sp3-pyramidal',
    ...buildMolecule('N', vecs, BOND_L, ['H', 'H', 'H'], 1),
    name: '氨', nameEN: 'Ammonia', formula: 'NH₃',
    charge: '',
    vsepr: { formula: 'AX₃E', stericNumber: 4, electronGeometry: '四面体形', electronGeometryEN: 'Tetrahedral',
             molecularGeometry: '三角锥形', molecularGeometryEN: 'Trigonal pyramidal',
             hybridization: 'sp³', idealBondAngle: '109.5°', actualBondAngle: '~107°' }
  });

  MOLECULES.push({
    id: 'ph3', group: 'sp3-pyramidal',
    ...buildMolecule('P', vecs, BOND_L * 1.1, ['H', 'H', 'H'], 1),
    name: '磷化氢', nameEN: 'Phosphine', formula: 'PH₃',
    charge: '',
    vsepr: { formula: 'AX₃E', stericNumber: 4, electronGeometry: '四面体形', electronGeometryEN: 'Tetrahedral',
             molecularGeometry: '三角锥形', molecularGeometryEN: 'Trigonal pyramidal',
             hybridization: 'sp³', idealBondAngle: '109.5°', actualBondAngle: '~93.5°' }
  });

  MOLECULES.push({
    id: 'h3o+', group: 'sp3-pyramidal',
    ...buildMolecule('O', vecs, BOND_L, ['H', 'H', 'H'], 1),
    name: '水合氢离子', nameEN: 'Hydronium ion', formula: 'H₃O⁺',
    charge: '+1',
    vsepr: { formula: 'AX₃E', stericNumber: 4, electronGeometry: '四面体形', electronGeometryEN: 'Tetrahedral',
             molecularGeometry: '三角锥形', molecularGeometryEN: 'Trigonal pyramidal',
             hybridization: 'sp³', idealBondAngle: '109.5°', actualBondAngle: '~107°' }
  });

  // AX₂E₂ - Bent
  MOLECULES.push({
    id: 'h2o', group: 'sp3-bent',
    ...buildMolecule('O', vecs, BOND_L, ['H', 'H'], 2),
    name: '水', nameEN: 'Water', formula: 'H₂O',
    charge: '',
    vsepr: { formula: 'AX₂E₂', stericNumber: 4, electronGeometry: '四面体形', electronGeometryEN: 'Tetrahedral',
             molecularGeometry: 'V形（弯曲形）', molecularGeometryEN: 'Bent',
             hybridization: 'sp³', idealBondAngle: '109.5°', actualBondAngle: '~104.5°' }
  });

  MOLECULES.push({
    id: 'h2s', group: 'sp3-bent',
    ...buildMolecule('S', vecs, BOND_L * 1.05, ['H', 'H'], 2),
    name: '硫化氢', nameEN: 'Hydrogen sulfide', formula: 'H₂S',
    charge: '',
    vsepr: { formula: 'AX₂E₂', stericNumber: 4, electronGeometry: '四面体形', electronGeometryEN: 'Tetrahedral',
             molecularGeometry: 'V形（弯曲形）', molecularGeometryEN: 'Bent',
             hybridization: 'sp³', idealBondAngle: '109.5°', actualBondAngle: '~92°' }
  });
})();

// --- sp³d - Trigonal Bipyramidal & derivatives ---

(function() {
  const eq = tbpEquatorialVectors();
  const ax = tbpAxialVectors();

  // AX₅ - Trigonal Bipyramidal
  MOLECULES.push({
    id: 'pcl5', group: 'sp3d-tbp',
    ...buildMolecule('P', [...ax, ...eq], BOND_L * 1.1, ['Cl', 'Cl', 'Cl', 'Cl', 'Cl']),
    name: '五氯化磷', nameEN: 'Phosphorus pentachloride', formula: 'PCl₅',
    charge: '',
    vsepr: { formula: 'AX₅', stericNumber: 5, electronGeometry: '三角双锥形', electronGeometryEN: 'Trigonal bipyramidal',
             molecularGeometry: '三角双锥形', molecularGeometryEN: 'Trigonal bipyramidal',
             hybridization: 'sp³d', idealBondAngle: '90°, 120°', actualBondAngle: '90°, 120°' }
  });

  // AX₄E - Seesaw (lone pair in equatorial)
  MOLECULES.push({
    id: 'sf4', group: 'sp3d-seesaw',
    ...buildMolecule('S', [...ax, ...eq], BOND_L, ['F', 'F', 'F', 'F'], 1),
    name: '四氟化硫', nameEN: 'Sulfur tetrafluoride', formula: 'SF₄',
    charge: '',
    vsepr: { formula: 'AX₄E', stericNumber: 5, electronGeometry: '三角双锥形', electronGeometryEN: 'Trigonal bipyramidal',
             molecularGeometry: '跷跷板形', molecularGeometryEN: 'Seesaw',
             hybridization: 'sp³d', idealBondAngle: '90°, 120°', actualBondAngle: '~87°, ~102°' }
  });

  // AX₃E₂ - T-shaped (2 lone pairs in equatorial)
  MOLECULES.push({
    id: 'clf3', group: 'sp3d-tshaped',
    ...buildMolecule('Cl', [...ax, ...eq], BOND_L, ['F', 'F', 'F'], 2),
    name: '三氟化氯', nameEN: 'Chlorine trifluoride', formula: 'ClF₃',
    charge: '',
    vsepr: { formula: 'AX₃E₂', stericNumber: 5, electronGeometry: '三角双锥形', electronGeometryEN: 'Trigonal bipyramidal',
             molecularGeometry: 'T形', molecularGeometryEN: 'T-shaped',
             hybridization: 'sp³d', idealBondAngle: '90°, 120°', actualBondAngle: '~87.5°' }
  });

  // AX₂E₃ - Linear (3 lone pairs in equatorial)
  MOLECULES.push({
    id: 'xef2', group: 'sp3d-linear',
    ...buildMolecule('Xe', [...ax, ...eq], BOND_L * 1.1, ['F', 'F'], 3),
    name: '二氟化氙', nameEN: 'Xenon difluoride', formula: 'XeF₂',
    charge: '',
    vsepr: { formula: 'AX₂E₃', stericNumber: 5, electronGeometry: '三角双锥形', electronGeometryEN: 'Trigonal bipyramidal',
             molecularGeometry: '直线形', molecularGeometryEN: 'Linear',
             hybridization: 'sp³d', idealBondAngle: '180°', actualBondAngle: '180°' }
  });
})();

// --- sp³d² - Octahedral & derivatives ---

(function() {
  const vecs = octahedralVectors();

  // AX₆ - Octahedral
  MOLECULES.push({
    id: 'sf6', group: 'sp3d2-octahedral',
    ...buildMolecule('S', vecs, BOND_L, ['F', 'F', 'F', 'F', 'F', 'F']),
    name: '六氟化硫', nameEN: 'Sulfur hexafluoride', formula: 'SF₆',
    charge: '',
    vsepr: { formula: 'AX₆', stericNumber: 6, electronGeometry: '八面体形', electronGeometryEN: 'Octahedral',
             molecularGeometry: '八面体形', molecularGeometryEN: 'Octahedral',
             hybridization: 'sp³d²', idealBondAngle: '90°', actualBondAngle: '90°' }
  });

  // AX₅E - Square Pyramidal (lone pair replaces one axial)
  // For octahedral, lone pair goes opposite to the missing axial
  // We use positions: ±x, ±y (equatorial), +z (axial); lone pair at -z
  MOLECULES.push({
    id: 'brf5', group: 'sp3d2-squarepyramidal',
    ...buildMolecule('Br', vecs, BOND_L * 1.05, ['F', 'F', 'F', 'F', 'F'], 1),
    name: '五氟化溴', nameEN: 'Bromine pentafluoride', formula: 'BrF₅',
    charge: '',
    vsepr: { formula: 'AX₅E', stericNumber: 6, electronGeometry: '八面体形', electronGeometryEN: 'Octahedral',
             molecularGeometry: '四方锥形', molecularGeometryEN: 'Square pyramidal',
             hybridization: 'sp³d²', idealBondAngle: '90°', actualBondAngle: '~85°' }
  });

  // AX₄E₂ - Square Planar (lone pairs replace both axial positions)
  MOLECULES.push({
    id: 'xef4', group: 'sp3d2-squareplanar',
    ...buildMolecule('Xe', vecs, BOND_L * 1.1, ['F', 'F', 'F', 'F'], 2),
    name: '四氟化氙', nameEN: 'Xenon tetrafluoride', formula: 'XeF₄',
    charge: '',
    vsepr: { formula: 'AX₄E₂', stericNumber: 6, electronGeometry: '八面体形', electronGeometryEN: 'Octahedral',
             molecularGeometry: '平面正方形', molecularGeometryEN: 'Square planar',
             hybridization: 'sp³d²', idealBondAngle: '90°', actualBondAngle: '90°' }
  });
})();

// ============================================================
// Group definitions for sidebar
// ============================================================

const MOLECULE_GROUPS = [
  { id: 'sp-linear',            title: 'sp 杂化 — 直线形',           icon: '─' },
  { id: 'sp2-planar',           title: 'sp² 杂化 — 平面三角形',      icon: '△' },
  { id: 'sp2-bent',             title: 'sp² 杂化 — V形（弯曲形）',    icon: '∠' },
  { id: 'sp3-tetrahedral',      title: 'sp³ 杂化 — 四面体形',        icon: '◈' },
  { id: 'sp3-pyramidal',        title: 'sp³ 杂化 — 三角锥形',         icon: '▲' },
  { id: 'sp3-bent',             title: 'sp³ 杂化 — V形（弯曲形）',    icon: '∠' },
  { id: 'sp3d-tbp',             title: 'sp³d 杂化 — 三角双锥形',     icon: '⏢' },
  { id: 'sp3d-seesaw',          title: 'sp³d 杂化 — 跷跷板形',       icon: '⏣' },
  { id: 'sp3d-tshaped',         title: 'sp³d 杂化 — T形',            icon: '⊥' },
  { id: 'sp3d-linear',          title: 'sp³d 杂化 — 直线形',         icon: '─' },
  { id: 'sp3d2-octahedral',     title: 'sp³d² 杂化 — 八面体形',     icon: '⬡' },
  { id: 'sp3d2-squarepyramidal',title: 'sp³d² 杂化 — 四方锥形',     icon: '▮' },
  { id: 'sp3d2-squareplanar',   title: 'sp³d² 杂化 — 平面正方形',    icon: '□' },
];

export { MOLECULES, MOLECULE_GROUPS, getAtomColor, getAtomRadius };
