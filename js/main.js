import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { MOLECULES, MOLECULE_GROUPS, getAtomColor, getAtomRadius } from './molecules.js';

// ============================================================
// DOM refs
// ============================================================

const viewerEl = document.getElementById('viewer');
const sidebarEl = document.getElementById('sidebar-scroll');
const infoPanelEl = document.getElementById('info-panel');
const toggleLonePairsBtn = document.getElementById('toggle-lone-pairs');
const toggleGeometryBtn = document.getElementById('toggle-geometry');
const toggleAutoRotateBtn = document.getElementById('toggle-auto-rotate');
const toggleLabelsBtn = document.getElementById('toggle-labels');
const resetViewBtn = document.getElementById('reset-view');
const molTitleEl = document.getElementById('mol-title');
const molFormulaEl = document.getElementById('mol-formula');
const molChargeEl = document.getElementById('mol-charge');
const vseprFormulaEl = document.getElementById('vsepr-formula');
const stericNumberEl = document.getElementById('steric-number');
const electronGeomEl = document.getElementById('electron-geometry');
const molecularGeomEl = document.getElementById('molecular-geometry');
const hybridizationEl = document.getElementById('hybridization');
const bondAngleEl = document.getElementById('bond-angle');

// ============================================================
// Three.js setup
// ============================================================

const scene = new THREE.Scene();

// Background gradient — dark blue-grey
scene.background = new THREE.Color(0x1a1d2e);
scene.fog = new THREE.Fog(0x1a1d2e, 8, 40);

const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
camera.position.set(4, 2.5, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
viewerEl.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
viewerEl.appendChild(labelRenderer.domElement);

// ============================================================
// Lighting
// ============================================================

const ambientLight = new THREE.AmbientLight(0x404060, 2.5);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 6);
keyLight.position.set(10, 15, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 1024;
keyLight.shadow.mapSize.height = 1024;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 60;
keyLight.shadow.camera.left = -15;
keyLight.shadow.camera.right = 15;
keyLight.shadow.camera.top = 15;
keyLight.shadow.camera.bottom = -15;
keyLight.shadow.bias = -0.0001;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x8899cc, 2);
fillLight.position.set(-5, 2, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 2);
rimLight.position.set(0, -1, 5);
scene.add(rimLight);

// ============================================================
// Ground & environment
// ============================================================

const gridHelper = new THREE.PolarGridHelper(6, 32, 24, 64, 0x3a3d55, 0x2a2d40);
scene.add(gridHelper);

// Subtle ground plane for shadows
const groundGeo = new THREE.PlaneGeometry(20, 20);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x252836,
  roughness: 0.8,
  metalness: 0.1,
  transparent: true,
  opacity: 0.6,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -5;
ground.receiveShadow = true;
scene.add(ground);

// ============================================================
// Orbit controls
// ============================================================

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI;
controls.target.set(0, 0, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;
controls.update();

// ============================================================
// Materials cache
// ============================================================

const materialCache = {};

function getMaterial(elem) {
  if (!materialCache[elem]) {
    const color = getAtomColor(elem);
    materialCache[elem] = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.25,
      metalness: 0.05,
    });
  }
  return materialCache[elem];
}

const lonePairMaterial = new THREE.MeshStandardMaterial({
  color: 0xcc88ff,
  roughness: 0.5,
  metalness: 0.0,
  transparent: true,
  opacity: 0.55,
});

const bondMaterial = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  roughness: 0.7,
  metalness: 0.0,
});

const bondMaterialDouble = new THREE.MeshStandardMaterial({
  color: 0xbbbbbb,
  roughness: 0.3,
  metalness: 0.1,
});

const geometryWireMaterial = new THREE.MeshBasicMaterial({
  color: 0x4466aa,
  transparent: true,
  opacity: 0.15,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const geometryLineMaterial = new THREE.LineBasicMaterial({
  color: 0x4466aa,
  transparent: true,
  opacity: 0.35,
});

// ============================================================
// Scene groups
// ============================================================

const moleculeGroup = new THREE.Group();
const lonePairGroup = new THREE.Group();
const geometryGroup = new THREE.Group();
const labelGroup = new THREE.Group();
scene.add(moleculeGroup);
scene.add(lonePairGroup);
scene.add(geometryGroup);
scene.add(labelGroup);

// ============================================================
// Builders
// ============================================================

function createAtom(elem, position, radius) {
  const r = radius || getAtomRadius(elem);
  const geo = new THREE.SphereGeometry(r, 48, 48);
  const mat = getMaterial(elem);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Shared helper: perpendicular direction for multi-bond offsets.
// Uses cross with Z axis so π bonds go out-of-plane for planar molecules.
function bondPerp(dir) {
  const perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1));
  if (perp.length() > 0.05) return perp.normalize();
  // Bond parallel to Z — use X axis instead
  perp.crossVectors(dir, new THREE.Vector3(1, 0, 0));
  return perp.normalize();
}

function createBond(from, to, order = 1) {
  const group = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(
    new THREE.Vector3(...to), new THREE.Vector3(...from)
  );
  const length = dir.length();
  const mid = new THREE.Vector3().addVectors(
    new THREE.Vector3(...from), new THREE.Vector3(...to)
  ).multiplyScalar(0.5);

  const bondRadius = 0.10;
  const geo = new THREE.CylinderGeometry(bondRadius, bondRadius, length, 16, 1);

  if (order === 1) {
    const mesh = new THREE.Mesh(geo, bondMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  } else if (order === 2) {
    const offset = bondPerp(dir).multiplyScalar(0.15);
    for (const sign of [-1, 1]) {
      const m = new THREE.Mesh(geo, bondMaterialDouble);
      m.position.copy(offset.clone().multiplyScalar(sign));
      m.castShadow = true;
      group.add(m);
    }
  } else if (order === 1.5) {
    // Delocalized: one normal + one thin offset
    const m1 = new THREE.Mesh(geo, bondMaterial);
    m1.castShadow = true;
    group.add(m1);
    const thinGeo = new THREE.CylinderGeometry(0.07, 0.07, length, 12, 1);
    const m2 = new THREE.Mesh(thinGeo, bondMaterialDouble);
    m2.position.copy(bondPerp(dir).multiplyScalar(0.2));
    m2.castShadow = true;
    group.add(m2);
  } else if (order === 3) {
    const offset = bondPerp(dir).multiplyScalar(0.22);
    const m1 = new THREE.Mesh(geo, bondMaterial);
    m1.castShadow = true;
    group.add(m1);
    const thinGeo = new THREE.CylinderGeometry(0.08, 0.08, length, 12, 1);
    for (const sign of [-1, 1]) {
      const m = new THREE.Mesh(thinGeo, bondMaterialDouble);
      m.position.copy(offset.clone().multiplyScalar(sign));
      m.castShadow = true;
      group.add(m);
    }
  }

  group.position.copy(mid);
  // Orient along the bond direction
  const quat = new THREE.Quaternion();
  quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  group.setRotationFromQuaternion(quat);

  return group;
}

function createLonePair(direction, atomRadius = 0.5) {
  // Lone pair as two lobes side-by-side (tangential), floating above the atom surface
  const group = new THREE.Group();
  const radial = new THREE.Vector3(...direction).normalize();

  // Position the lobes outside the central atom
  const dist = atomRadius + 0.38;

  // Perpendicular direction so lobes sit "horizontally" beside each other
  const perp = new THREE.Vector3().crossVectors(radial, new THREE.Vector3(0, 0, 1));
  if (perp.length() < 0.05) {
    perp.crossVectors(radial, new THREE.Vector3(1, 0, 0));
  }
  perp.normalize();

  const sep = 0.13;
  const base = radial.clone().multiplyScalar(dist);
  const geo = new THREE.SphereGeometry(0.15, 16, 16);

  const m1 = new THREE.Mesh(geo, lonePairMaterial);
  m1.position.copy(base.clone().add(perp.clone().multiplyScalar(sep)));
  group.add(m1);
  const m2 = new THREE.Mesh(geo, lonePairMaterial);
  m2.position.copy(base.clone().add(perp.clone().multiplyScalar(-sep)));
  group.add(m2);
  return group;
}

function createAtomLabel(elem, position, index) {
  const div = document.createElement('div');
  div.textContent = elem;
  div.style.cssText = `
    color: #e0e0e0;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    text-shadow: 0 0 8px rgba(0,0,0,0.7), 0 0 3px rgba(0,0,0,0.9);
    pointer-events: none;
    user-select: none;
  `;
  const label = new CSS2DObject(div);
  label.position.set(
    position[0], position[1] + getAtomRadius(elem) + 0.32, position[2]
  );
  label.userData = { element: elem };
  return label;
}

function createGeometryWireframe(positions) {
  const group = new THREE.Group();

  if (positions.length < 2) return group;

  // Compute the average distance from origin (central atom)
  let avgDist = 0;
  for (const p of positions) {
    avgDist += Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
  }
  avgDist /= positions.length;

  // Edges whose midpoint is very close to the central atom are "internal"
  // (e.g. opposite vertices in octahedron, axial-axial in TBP).
  // Filter them out so only true polyhedron surface edges remain.
  const internalThreshold = avgDist * 0.25;

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const mx = (positions[i][0] + positions[j][0]) / 2;
      const my = (positions[i][1] + positions[j][1]) / 2;
      const mz = (positions[i][2] + positions[j][2]) / 2;
      const midDist = Math.sqrt(mx * mx + my * my + mz * mz);

      // For n=2 (linear), the only edge goes through the center — keep it
      if (positions.length > 2 && midDist < internalThreshold) continue;

      const pts = [
        new THREE.Vector3(...positions[i]),
        new THREE.Vector3(...positions[j]),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(lineGeo, geometryLineMaterial);
      group.add(line);
    }
  }

  // Build a proper polyhedron mesh from the positions for the translucent fill
  const polyGeo = buildPolyhedronGeometry(positions);
  if (polyGeo) {
    const polyMesh = new THREE.Mesh(polyGeo, geometryWireMaterial);
    group.add(polyMesh);
  }

  return group;
}

function buildPolyhedronGeometry(positions) {
  // Build a convex polyhedron from the given vertex positions.
  // We create the geometry by building triangular faces from the convex hull.
  // For common VSEPR geometries this produces the correct polyhedron shape.
  if (positions.length < 3) return null;

  // Collect all triangles where 3 vertices form a face of the convex hull.
  // A simple approach: for each triplet of positions, check if all other
  // points lie on the same side of the plane (i.e. it's a hull face).
  const verts = positions.map(p => new THREE.Vector3(...p));
  const n = verts.length;

  // Compute convex hull using gift-wrapping for small N
  // For VSEPR polyhedra (n ≤ 6), exhaustive triplet check is fast
  const faces = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        // Compute plane normal
        const ab = new THREE.Vector3().subVectors(verts[j], verts[i]);
        const ac = new THREE.Vector3().subVectors(verts[k], verts[i]);
        const normal = new THREE.Vector3().crossVectors(ab, ac);

        if (normal.length() < 0.0001) continue; // collinear
        normal.normalize();

        // Compute signed distance of all other points from this plane
        let posCount = 0, negCount = 0;
        let allSameSide = true;

        for (let m = 0; m < n; m++) {
          if (m === i || m === j || m === k) continue;
          const d = new THREE.Vector3().subVectors(verts[m], verts[i]).dot(normal);
          if (d > 0.001) posCount++;
          else if (d < -0.001) negCount++;
        }

        // All other points on the same side → hull face
        if (posCount === 0 || negCount === 0) {
          // Orient face outward
          const center = new THREE.Vector3();
          verts.forEach(v => center.add(v));
          center.divideScalar(n);
          if (new THREE.Vector3().subVectors(verts[i], center).dot(normal) < 0) {
            faces.push(i, j, k);
          } else {
            faces.push(i, k, j);
          }
        }
      }
    }
  }

  if (faces.length === 0) return null;

  // Build BufferGeometry from faces
  const faceVerts = faces.map(idx => verts[idx]);
  const geo = new THREE.BufferGeometry();
  const triCount = faces.length / 3;
  const vertexCount = triCount * 3;
  const positions_arr = new Float32Array(vertexCount * 3);
  const normals_arr = new Float32Array(vertexCount * 3);

  for (let t = 0; t < triCount; t++) {
    const a = verts[faces[t * 3]];
    const b = verts[faces[t * 3 + 1]];
    const c = verts[faces[t * 3 + 2]];
    const ab2 = new THREE.Vector3().subVectors(b, a);
    const ac2 = new THREE.Vector3().subVectors(c, a);
    const n2 = new THREE.Vector3().crossVectors(ab2, ac2).normalize();

    for (let v = 0; v < 3; v++) {
      const idx = t * 9 + v * 3;
      const vert = verts[faces[t * 3 + v]];
      positions_arr[idx] = vert.x;
      positions_arr[idx + 1] = vert.y;
      positions_arr[idx + 2] = vert.z;
      normals_arr[idx] = n2.x;
      normals_arr[idx + 1] = n2.y;
      normals_arr[idx + 2] = n2.z;
    }
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions_arr, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals_arr, 3));
  return geo;
}

// ============================================================
// Build molecule in scene
// ============================================================

let currentMol = null;
let showLonePairs = true;
let showGeometry = false;
let showLabels = true;

function clearGroup(group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
    // Recurse into sub-groups
    while (child.children && child.children.length > 0) {
      const c = child.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) {
          c.material.forEach(m => m.dispose());
        } else {
          c.material.dispose();
        }
      }
      child.remove(c);
    }
    group.remove(child);
  }
}

function buildMolecule(mol) {
  clearGroup(moleculeGroup);
  clearGroup(lonePairGroup);
  clearGroup(geometryGroup);
  clearGroup(labelGroup);

  currentMol = mol;

  // Atoms
  mol.atoms.forEach((atom, i) => {
    const mesh = createAtom(atom.elem, atom.pos);
    moleculeGroup.add(mesh);

    if (showLabels) {
      const label = createAtomLabel(atom.elem, atom.pos, i);
      labelGroup.add(label);
    }
  });

  // Bonds
  const bondOrders = mol.bondOrders || mol.bonds;
  mol.bonds.forEach((bond, i) => {
    let order = 1;
    if (Array.isArray(bondOrders[i]) && bondOrders[i].length === 3) {
      order = bondOrders[i][2];
    } else if (typeof bond[2] === 'number') {
      order = bond[2];
    }
    const from = mol.atoms[bond[0]].pos;
    const to = mol.atoms[bond[1]].pos;
    const bondMesh = createBond(from, to, order);
    moleculeGroup.add(bondMesh);
  });

  // Lone pairs
  if (showLonePairs && mol.lonePairVectors) {
    const centralR = getAtomRadius(mol.atoms[0].elem);
    mol.lonePairVectors.forEach(lp => {
      const lpMesh = createLonePair(lp, centralR);
      lonePairGroup.add(lpMesh);
    });
  }

  // Electron geometry wireframe
  if (showGeometry) {
    const epPositions = mol.atoms.slice(1).map(a => a.pos);
    if (mol.lonePairVectors) {
      const lpDist = getAtomRadius(mol.atoms[0].elem) + 0.22;
      mol.lonePairVectors.forEach(lp => {
        const len = Math.sqrt(lp[0] ** 2 + lp[1] ** 2 + lp[2] ** 2);
        if (len > 0.001) {
          const s = lpDist / len;
          epPositions.push([lp[0] * s, lp[1] * s, lp[2] * s]);
        }
      });
    }
    const geoWire = createGeometryWireframe(epPositions);
    geometryGroup.add(geoWire);
  }

  updateInfoPanel(mol);
}

function updateInfoPanel(mol) {
  const v = mol.vsepr;
  molTitleEl.textContent = mol.name;
  molFormulaEl.textContent = mol.formula;
  if (mol.charge) {
    molChargeEl.textContent = `(${mol.charge})`;
    molChargeEl.style.display = 'inline';
  } else {
    molChargeEl.textContent = '';
    molChargeEl.style.display = 'none';
  }
  vseprFormulaEl.textContent = v.formula;
  stericNumberEl.textContent = v.stericNumber;
  electronGeomEl.textContent = v.electronGeometry;
  molecularGeomEl.textContent = v.molecularGeometry;
  hybridizationEl.textContent = v.hybridization;
  bondAngleEl.textContent = `理想 ${v.idealBondAngle}  实际 ${v.actualBondAngle}`;
}

// ============================================================
// Sidebar
// ============================================================

function buildSidebar() {
  MOLECULE_GROUPS.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'sidebar-group';

    const header = document.createElement('div');
    header.className = 'sidebar-group-header';
    header.textContent = group.title;
    groupDiv.appendChild(header);

    const list = document.createElement('div');
    list.className = 'sidebar-molecule-list';

    const mols = MOLECULES.filter(m => m.group === group.id);
    mols.forEach(mol => {
      const item = document.createElement('div');
      item.className = 'sidebar-molecule-item';
      item.dataset.molId = mol.id;
      item.innerHTML = `
        <span class="mol-item-formula">${mol.formula}</span>
        <span class="mol-item-name">${mol.name}</span>
      `;
      item.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-molecule-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        buildMolecule(mol);
      });
      list.appendChild(item);
    });

    groupDiv.appendChild(list);
    sidebarEl.appendChild(groupDiv);
  });
}

// ============================================================
// Event handlers
// ============================================================

toggleLonePairsBtn.addEventListener('click', () => {
  showLonePairs = !showLonePairs;
  toggleLonePairsBtn.classList.toggle('active', showLonePairs);
  if (currentMol) {
    clearGroup(lonePairGroup);
    if (showLonePairs && currentMol.lonePairVectors) {
      const centralR = getAtomRadius(currentMol.atoms[0].elem);
      currentMol.lonePairVectors.forEach(lp => {
        lonePairGroup.add(createLonePair(lp, centralR));
      });
    }
  }
});

toggleGeometryBtn.addEventListener('click', () => {
  showGeometry = !showGeometry;
  toggleGeometryBtn.classList.toggle('active', showGeometry);
  if (currentMol) {
    clearGroup(geometryGroup);
    if (showGeometry) {
      const epPositions = currentMol.atoms.slice(1).map(a => a.pos);
      if (currentMol.lonePairVectors) {
        const lpDist = getAtomRadius(currentMol.atoms[0].elem) + 0.22;
        currentMol.lonePairVectors.forEach(lp => {
          const len = Math.sqrt(lp[0] ** 2 + lp[1] ** 2 + lp[2] ** 2);
          if (len > 0.001) {
            const s = lpDist / len;
            epPositions.push([lp[0] * s, lp[1] * s, lp[2] * s]);
          }
        });
      }
      geometryGroup.add(createGeometryWireframe(epPositions));
    }
  }
});

toggleAutoRotateBtn.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  toggleAutoRotateBtn.classList.toggle('active', controls.autoRotate);
});

toggleLabelsBtn.addEventListener('click', () => {
  showLabels = !showLabels;
  toggleLabelsBtn.classList.toggle('active', showLabels);
  if (currentMol) {
    clearGroup(labelGroup);
    if (showLabels) {
      currentMol.atoms.forEach((atom, i) => {
        labelGroup.add(createAtomLabel(atom.elem, atom.pos, i));
      });
    }
  }
});

resetViewBtn.addEventListener('click', () => {
  camera.position.set(4, 2.5, 8);
  controls.target.set(0, 0, 0);
  controls.update();
});

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  switch (e.key.toLowerCase()) {
    case 'l': toggleLonePairsBtn.click(); break;
    case 'g': toggleGeometryBtn.click(); break;
    case 'r': controls.autoRotate = !controls.autoRotate;
              toggleAutoRotateBtn.classList.toggle('active', controls.autoRotate); break;
    case 't': toggleLabelsBtn.click(); break;
    case '0': resetViewBtn.click(); break;
  }
});

// ============================================================
// Resize handler
// ============================================================

function resize() {
  const rect = viewerEl.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);

// ============================================================
// Animation loop
// ============================================================

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// ============================================================
// Init
// ============================================================

buildSidebar();
resize();

// Load default molecule (CH₄)
const defaultMol = MOLECULES.find(m => m.id === 'ch4') || MOLECULES[0];
buildMolecule(defaultMol);
const defaultItem = document.querySelector(`[data-mol-id="${defaultMol.id}"]`);
if (defaultItem) defaultItem.classList.add('active');

animate();
