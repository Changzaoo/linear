import {
  createContext,
  MutableRefObject,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Line } from "@react-three/drei";
import { MotionValue } from "framer-motion";
import * as THREE from "three";
import { supportsWebGL, isMobileViewport } from "../lib/webgl";
import {
  woodTexture,
  stoneTexture,
  floorTexture,
  contactShadowTexture,
} from "../lib/textures";
import { sceneDpr, tuneRendererQuality, tuneTextureSampling } from "../lib/renderQuality";

/* ============================================================
   ScrollFurnitureAssembly — padrão planejados de luxo BR
   Ambiente comercial completo montado conforme o scroll:
   balcão em pedra com cascata, painel ripado retroiluminado,
   estante com LED, torre expositora, credenza, lounge com
   poltronas, arara em latão, planta, quadro, nichos, pendentes
   e sanca. Texturas procedurais (sem assets externos).
   ============================================================ */

type Progress = MotionValue<number>;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function windowProgress(p: number, start: number, end: number) {
  return easeOutCubic(clamp01((p - start) / (end - start)));
}

/* ---------- Acabamentos (metais e superfícies sem textura) ---------- */
const FIN = {
  brass: { color: "#d8b070", metalness: 0.75, roughness: 0.28 },
  brassDark: { color: "#8a6a42", metalness: 0.7, roughness: 0.35 },
  matteWall: { color: "#1c1712", roughness: 0.92, metalness: 0.0 },
  black: { color: "#0e0b08", roughness: 0.85, metalness: 0.05 },
  ceramic: { color: "#e6ddcc", roughness: 0.55, metalness: 0.0 },
  glass: { color: "#cfd8da", roughness: 0.06, metalness: 0.3 },
  led: { color: "#ffd9a0", emissive: "#ffbe6e", emissiveIntensity: 2.2 },
  fabric: { color: "#675b4e", roughness: 0.95, metalness: 0.0 },
  fabricLight: { color: "#7a6e5f", roughness: 0.95, metalness: 0.0 },
};

interface PieceProps {
  progress: Progress;
  window: [number, number];
  from: [number, number, number];
  to: [number, number, number];
  rotFrom?: number;
  children: ReactNode;
  onUpdate?: (t: number) => void;
}

/* ---------- Montagem peça a peça ----------
   `PieceT` carrega o progresso LOCAL de cada móvel (0→1 dentro da sua
   janela de scroll). Os componentes internos usam esse valor através do
   <Part> para deslizar, descer ou seguir no eixo de encaixe e travar um
   a um — assim não é o móvel inteiro que aparece de bloco, e sim cada
   coisinha sendo atribuída (carcaça → prateleiras → ferragens → decoração). */
const PieceT = createContext<MutableRefObject<number> | null>(null);

interface PartProps {
  /** Posição final (local) da peça, já montada. */
  position?: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  /** Deslocamento de montagem que colapsa a zero (eixo de encaixe). */
  offset?: readonly [number, number, number];
  /** Rotação extra que se desfaz ao assentar (ex.: parafuso rosqueando). */
  spin?: number;
  /** Sub-janela dentro do progresso do móvel: escalona a ordem de montagem. */
  win?: [number, number];
  children: ReactNode;
}

/** Sub-grupo que se monta dentro de um <Piece>, seguindo o eixo de encaixe. */
function Part({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  offset = [0, 0, 0],
  spin = 0,
  win = [0, 1],
  children,
}: PartProps) {
  const tRef = useContext(PieceT);
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = tRef ? tRef.current : 1;
    const s = windowProgress(t, win[0], win[1]); // 0→1 com easeOut
    const k = 1 - s; // quanto ainda falta encaixar
    g.position.set(
      position[0] + offset[0] * k,
      position[1] + offset[1] * k,
      position[2] + offset[2] * k
    );
    g.rotation.set(rotation[0], rotation[1] + spin * k, rotation[2]);
    // Cada peça só ganha matéria a partir da sua deixa — assim ela
    // aparece encaixando, em vez de pairar pronta antes da hora. O <Piece>
    // pula as subárvores marcadas (assembled), então quem manda na opacidade
    // aqui dentro é este <Part>, sem depender da ordem dos useFrame.
    g.visible = s > 0.001;
    g.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const base = (obj.userData.baseOpacity as number | undefined) ?? 1;
      mats.forEach((m) => {
        (m as THREE.Material).opacity = s * base;
      });
    });
  });

  return (
    <group ref={ref} userData={{ assembled: true }}>
      {children}
    </group>
  );
}

/** Aplica a opacidade do <Piece> aos filhos diretos, mas NÃO desce em
    subárvores de <Part> (essas controlam o próprio fade por sub-janela). */
function fadeOwnChildren(obj: THREE.Object3D, t: number) {
  for (const child of obj.children) {
    if (child.userData.assembled) continue; // um <Part> cuida de si mesmo
    const mesh = child as THREE.Mesh;
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const base = (child.userData.baseOpacity as number | undefined) ?? 1;
      mats.forEach((m) => {
        (m as THREE.Material).opacity = t * base;
      });
    }
    fadeOwnChildren(child, t);
  }
}

/** Grupo animado: entra de fora da cena, encaixa e ganha opacidade. */
function Piece({ progress, window: win, from, to, rotFrom = 0, children, onUpdate }: PieceProps) {
  const ref = useRef<THREE.Group>(null);
  const tRef = useRef(0);
  const fromV = useMemo(() => new THREE.Vector3(...from), [from]);
  const toV = useMemo(() => new THREE.Vector3(...to), [to]);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = windowProgress(progress.get(), win[0], win[1]);
    tRef.current = t;
    g.position.lerpVectors(fromV, toV, t);
    g.rotation.y = rotFrom * (1 - t);
    g.visible = t > 0.001;
    fadeOwnChildren(g, t);
    onUpdate?.(t);
  });

  return (
    <PieceT.Provider value={tRef}>
      <group ref={ref}>{children}</group>
    </PieceT.Provider>
  );
}

/* ---------- Sombra de contato: aterra o móvel no piso ---------- */
function ContactShadow({
  size,
  position = [0, 0.012, 0],
}: {
  size: [number, number];
  position?: [number, number, number];
}) {
  const tex = useMemo(() => contactShadowTexture(), []);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
      userData={{ baseOpacity: 0.55, noShadow: true }}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

/* ---------- Realismo: sombras dinâmicas + exposição calibrada ----------
   Ativa sombras em todos os meshes sólidos (vidros e sombras de contato
   ficam de fora) e ajusta o tom da renderização. */
function RealismTuning({ enableShadows }: { enableShadows: boolean }) {
  const { scene, gl } = useThree();

  useEffect(() => {
    scene.environmentIntensity = 0.45;
    gl.toneMappingExposure = 1.12;
    tuneRendererQuality(gl, enableShadows);
    tuneTextureSampling(scene, gl);
    if (!enableShadows) return;
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (mesh.userData.noShadow) return;
      const base = (mesh.userData.baseOpacity as number | undefined) ?? 1;
      mesh.castShadow = base >= 0.6;
      mesh.receiveShadow = true;
    });
  }, [scene, gl, enableShadows]);

  return null;
}

/* ---------- Objetos decorativos (estilo vitrine de luxo) ---------- */
function Vase({
  position,
  height = 0.26,
  radius = 0.06,
  color = "#e6ddcc",
}: {
  position: [number, number, number];
  height?: number;
  radius?: number;
  color?: string;
}) {
  return (
    <mesh position={[position[0], position[1] + height / 2, position[2]]}>
      <cylinderGeometry args={[radius * 0.75, radius, height, 14]} />
      <meshStandardMaterial color={color} roughness={0.55} transparent />
    </mesh>
  );
}

/** Vaso com galhos secos. `scale` controla a altura total (evita invadir a prateleira de cima). */
function BranchVase({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.045, 0.07, 0.32, 14]} />
        <meshStandardMaterial color="#d9cfbc" roughness={0.6} transparent />
      </mesh>
      {[-0.28, 0.05, 0.32].map((rz, i) => (
        <mesh key={i} position={[rz * 0.18, 0.5, 0]} rotation={[0, 0, rz]}>
          <cylinderGeometry args={[0.006, 0.009, 0.5, 6]} />
          <meshStandardMaterial color="#6b4d2e" roughness={0.9} transparent />
        </mesh>
      ))}
    </group>
  );
}

function BookStack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.26, 0.04, 0.18]} />
        <meshStandardMaterial color="#3a2c1c" roughness={0.7} transparent />
      </mesh>
      <mesh position={[0.02, 0.06, 0]} rotation={[0, 0.18, 0]}>
        <boxGeometry args={[0.22, 0.035, 0.16]} />
        <meshStandardMaterial color="#b89a6a" roughness={0.6} transparent />
      </mesh>
    </group>
  );
}

function GlassSphere({ position, r = 0.06 }: { position: [number, number, number]; r?: number }) {
  return (
    <mesh position={position} userData={{ baseOpacity: 0.35 }}>
      <sphereGeometry args={[r, 16, 12]} />
      <meshStandardMaterial {...FIN.glass} transparent />
    </mesh>
  );
}

/** Frasco de perfume com tampa de latão (vitrines e bandejas). */
function PerfumeBottle({
  position,
  color = "#caa86a",
}: {
  position: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} userData={{ baseOpacity: 0.85 }}>
        <boxGeometry args={[0.07, 0.12, 0.045]} />
        <meshStandardMaterial color={color} roughness={0.15} metalness={0.1} transparent />
      </mesh>
      <mesh position={[0, 0.135, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.03, 10]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
    </group>
  );
}

/** Caixa de presente com fita de latão. */
function GiftBox({
  position,
  size = 0.22,
  color = "#2e2a26",
}: {
  position: [number, number, number];
  size?: number;
  color?: string;
}) {
  const h = size * 0.6;
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[size, h, size]} />
        <meshStandardMaterial color={color} roughness={0.6} transparent />
      </mesh>
      <mesh position={[0, h + 0.004, 0]}>
        <boxGeometry args={[size + 0.006, 0.008, size * 0.16]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <mesh position={[0, h + 0.004, 0]}>
        <boxGeometry args={[size * 0.16, 0.008, size + 0.006]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
    </group>
  );
}

/** Pilha de peças dobradas (visual de varejo de vestuário). */
function FoldedStack({ position }: { position: [number, number, number] }) {
  const items = [
    { y: 0.0225, color: "#5a4a3a", rot: 0.06 },
    { y: 0.0675, color: "#3d3630", rot: -0.05 },
    { y: 0.1125, color: "#7a6a55", rot: 0.03 },
  ];
  return (
    <group position={position}>
      {items.map((it, i) => (
        <mesh key={i} position={[0, it.y, 0]} rotation={[0, it.rot, 0]}>
          <boxGeometry args={[0.3, 0.045, 0.24]} />
          <meshStandardMaterial color={it.color} roughness={0.95} transparent />
        </mesh>
      ))}
    </group>
  );
}

/** Abajur com cúpula de tecido e corpo em latão. */
function TableLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.02, 14]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 8]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 0.16, 16, 1, true]} />
        <meshStandardMaterial
          color="#e8dcc4"
          emissive="#ffd9a0"
          emissiveIntensity={0.3}
          roughness={0.9}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
    </group>
  );
}

/** Porta-retrato em latão levemente inclinado. */
function MiniFrame({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[-0.1, 0.15, 0]}>
      <mesh position={[0, 0.13, 0]}>
        <boxGeometry args={[0.2, 0.26, 0.012]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <mesh position={[0, 0.13, 0.004]}>
        <boxGeometry args={[0.16, 0.22, 0.012]} />
        <meshStandardMaterial color="#20180f" roughness={0.7} transparent />
      </mesh>
    </group>
  );
}

/** Mini-planta em vaso para prateleiras. */
function SmallPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.09, 12]} />
        <meshStandardMaterial color="#2b251f" roughness={0.8} transparent />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.075, 10, 8]} />
        <meshStandardMaterial color="#3a4634" roughness={1} transparent />
      </mesh>
    </group>
  );
}

/** Banqueta alta estofada com pés e apoio em latão. */
function Stool({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pés (encostam no anel de apoio) */}
      {[
        [-0.11, -0.11],
        [-0.11, 0.11],
        [0.11, -0.11],
        [0.11, 0.11],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3, z]}>
          <cylinderGeometry args={[0.014, 0.012, 0.6, 8]} />
          <meshStandardMaterial {...FIN.brass} transparent />
        </mesh>
      ))}
      {/* Anel de apoio para os pés */}
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.155, 0.011, 8, 24]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      {/* Assento estofado */}
      <mesh position={[0, 0.64, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 18]} />
        <meshStandardMaterial {...FIN.fabric} transparent />
      </mesh>
    </group>
  );
}

/** Busto de manequim abstrato sobre pedestal de latão. */
function MannequinBust({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <ContactShadow size={[0.8, 0.8]} />
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.02, 16]} />
        <meshStandardMaterial {...FIN.black} transparent />
      </mesh>
      <mesh position={[0, 0.395, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.75, 8]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      {/* Torso em tecido */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.12, 0.17, 0.55, 16]} />
        <meshStandardMaterial color="#2e2a26" roughness={0.95} transparent />
      </mesh>
      <mesh position={[0, 1.33, 0]} scale={[1, 0.35, 1]}>
        <sphereGeometry args={[0.12, 14, 10]} />
        <meshStandardMaterial color="#2e2a26" roughness={0.95} transparent />
      </mesh>
    </group>
  );
}

/** Espelho de piso encostado na parede lateral. */
function FloorMirror() {
  return (
    // Construído no plano XY e rotacionado para a parede lateral (normal +x)
    <group rotation={[0, Math.PI / 2, 0]}>
      <group position={[0, 1.12, 0]} rotation={[-0.07, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.85, 2.25, 0.05]} />
          <meshStandardMaterial {...FIN.brassDark} transparent />
        </mesh>
        <mesh position={[0, 0, 0.028]}>
          <boxGeometry args={[0.75, 2.15, 0.01]} />
          <meshStandardMaterial color="#aeb4b6" metalness={1} roughness={0.12} transparent />
        </mesh>
      </group>
    </group>
  );
}

/** Quadro emoldurado para a parede principal (plano XY, frente +z). */
function FramedArt({ w, h, tone }: { w: number; h: number; tone: string }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[w, h, 0.035]} />
        <meshStandardMaterial map={woodTexture("#46301c", "#2f1f10", "#5c4024")} roughness={0.55} transparent />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[w * 0.78, h * 0.78, 0.012]} />
        <meshStandardMaterial color={tone} roughness={0.85} transparent />
      </mesh>
      {/* Detalhe gráfico em latão na arte */}
      <mesh position={[0, -h * 0.12, 0.03]}>
        <boxGeometry args={[w * 0.5, 0.012, 0.006]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
    </group>
  );
}

/** Relógio de parede em latão. */
function WallClock() {
  return (
    <group>
      <mesh>
        <torusGeometry args={[0.22, 0.016, 10, 36]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.012, 28]} />
        <meshStandardMaterial color="#0f0c09" roughness={0.6} transparent />
      </mesh>
      {/* Ponteiros */}
      <mesh position={[0, 0.05, 0.012]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.012, 0.15, 0.006]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <mesh position={[0.03, 0.01, 0.012]} rotation={[0, 0, 1.25]}>
        <boxGeometry args={[0.01, 0.1, 0.006]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <sphereGeometry args={[0.014, 10, 8]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
    </group>
  );
}

/** Luminária de piso com cúpula iluminada. */
function FloorLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 0.025, 16]} />
        <meshStandardMaterial {...FIN.black} transparent />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.52, 8]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <mesh position={[0, 1.62, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.26, 18, 1, true]} />
        <meshStandardMaterial
          color="#e8dcc4"
          emissive="#ffd9a0"
          emissiveIntensity={0.35}
          roughness={0.9}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
    </group>
  );
}

/** Cesto decorativo de fibra. */
function Basket({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <ContactShadow size={[0.7, 0.7]} />
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.32, 16]} />
        <meshStandardMaterial color="#8a6f4d" roughness={1} transparent />
      </mesh>
      <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.018, 8, 24]} />
        <meshStandardMaterial color="#74583a" roughness={1} transparent />
      </mesh>
      {/* Manta enrolada dentro do cesto */}
      <mesh position={[0, 0.34, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.24, 12]} />
        <meshStandardMaterial color="#a79d91" roughness={1} transparent />
      </mesh>
    </group>
  );
}

/** Mesa expositora redonda com produtos. */
function DisplayTable({ freijo, stone }: { freijo: THREE.Texture; stone: THREE.Texture }) {
  return (
    <group>
      <ContactShadow size={[1.7, 1.7]} />
      {/* Base e coluna */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.05, 20]} />
        <meshStandardMaterial {...FIN.black} transparent />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.74, 14]} />
        <meshStandardMaterial map={stone} roughness={0.35} transparent />
      </mesh>
      {/* Tampo em freijó com borda de latão */}
      <mesh position={[0, 0.825, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.05, 28]} />
        <meshStandardMaterial map={freijo} roughness={0.5} transparent />
      </mesh>
      <mesh position={[0, 0.825, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.008, 8, 36]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      {/* Produtos sobre o tampo (superfície em y = 0.85) */}
      <GiftBox position={[-0.18, 0.85, 0.12]} size={0.22} color="#2e2a26" />
      <GiftBox position={[0.14, 0.85, -0.14]} size={0.15} color="#b89a6a" />
      <FoldedStack position={[0.26, 0.85, 0.2]} />
      <Vase position={[-0.28, 0.85, -0.22]} height={0.2} radius={0.045} color="#d9cfbc" />
      <PerfumeBottle position={[0.02, 0.85, 0.05]} />
    </group>
  );
}

/* ---------- Mobiliário do lounge ---------- */
function Armchair({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Assento (pés terminam exatamente na base do assento) */}
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[0.66, 0.16, 0.62]} />
        <meshStandardMaterial {...FIN.fabric} transparent />
      </mesh>
      {/* Almofada */}
      <mesh position={[0, 0.45, 0.02]}>
        <boxGeometry args={[0.6, 0.08, 0.54]} />
        <meshStandardMaterial {...FIN.fabricLight} transparent />
      </mesh>
      {/* Encosto */}
      <mesh position={[0, 0.64, -0.28]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.66, 0.56, 0.12]} />
        <meshStandardMaterial {...FIN.fabric} transparent />
      </mesh>
      {/* Braços */}
      {[-0.37, 0.37].map((x, i) => (
        <mesh key={i} position={[x, 0.47, 0.0]}>
          <boxGeometry args={[0.1, 0.3, 0.58]} />
          <meshStandardMaterial {...FIN.fabric} transparent />
        </mesh>
      ))}
      {/* Almofada apoiada no encosto */}
      <mesh position={[0.08, 0.58, -0.16]} rotation={[-0.28, 0, 0.08]}>
        <boxGeometry args={[0.3, 0.3, 0.09]} />
        <meshStandardMaterial color="#8a7a64" roughness={0.95} transparent />
      </mesh>
      {/* Pés palito em latão */}
      {[
        [-0.26, -0.22],
        [-0.26, 0.22],
        [0.26, -0.22],
        [0.26, 0.22],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.13, z]}>
          <cylinderGeometry args={[0.016, 0.012, 0.26, 8]} />
          <meshStandardMaterial {...FIN.brass} transparent />
        </mesh>
      ))}
    </group>
  );
}

function SideTable({ position }: { position: [number, number, number] }) {
  const stone = stoneTexture();
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.04, 18]} />
        <meshStandardMaterial {...FIN.black} transparent />
      </mesh>
      <mesh position={[0, 0.29, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 10]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <mesh position={[0, 0.56, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 24]} />
        <meshStandardMaterial map={stone} roughness={0.3} transparent />
      </mesh>
      {/* Xícara decorativa sobre o tampo (apoiada, sem atravessar) */}
      <mesh position={[0.08, 0.61, 0.04]}>
        <cylinderGeometry args={[0.035, 0.03, 0.06, 12]} />
        <meshStandardMaterial {...FIN.ceramic} transparent />
      </mesh>
    </group>
  );
}

function FloorPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <ContactShadow size={[1.1, 1.1]} />
      {/* Cachepô */}
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.42, 16]} />
        <meshStandardMaterial color="#2b251f" roughness={0.8} transparent />
      </mesh>
      {/* Tronco */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.5, 8]} />
        <meshStandardMaterial color="#4a3a26" roughness={0.9} transparent />
      </mesh>
      {/* Folhagem (volumes orgânicos) */}
      {[
        { p: [0, 1.18, 0] as const, r: 0.3 },
        { p: [0.2, 0.98, 0.1] as const, r: 0.24 },
        { p: [-0.2, 1.36, -0.06] as const, r: 0.22 },
        { p: [0.08, 1.48, 0.12] as const, r: 0.17 },
      ].map((f, i) => (
        <mesh key={i} position={[f.p[0], f.p[1], f.p[2]]}>
          <sphereGeometry args={[f.r, 12, 10]} />
          <meshStandardMaterial color="#3a4634" roughness={1} transparent />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Arara de roupas em latão ---------- */
function ClothingRack() {
  const garments = [
    { x: -0.48, color: "#5a4a3a", rot: 0.05 },
    { x: -0.16, color: "#2e2a26", rot: -0.04 },
    { x: 0.16, color: "#7a6a55", rot: 0.03 },
    { x: 0.48, color: "#3d3630", rot: -0.05 },
  ];
  return (
    <group>
      <ContactShadow size={[2.0, 1.0]} />
      {/* Montantes */}
      {[-0.75, 0.75].map((x, i) => (
        <mesh key={i} position={[x, 0.81, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.62, 10]} />
          <meshStandardMaterial {...FIN.brass} transparent />
        </mesh>
      ))}
      {/* Pés */}
      {[-0.75, 0.75].map((x, i) => (
        <mesh key={i} position={[x, 0.02, 0]}>
          <boxGeometry args={[0.05, 0.04, 0.5]} />
          <meshStandardMaterial {...FIN.brassDark} transparent />
        </mesh>
      ))}
      {/* Barra superior */}
      <mesh position={[0, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 1.56, 10]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      {/* Peças penduradas: gancho toca a barra, cabide segura a peça */}
      {garments.map((g, i) => (
        <group key={i} position={[g.x, 0, 0]} rotation={[0, g.rot, 0]}>
          <mesh position={[0, 1.57, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.06, 6]} />
            <meshStandardMaterial {...FIN.brassDark} transparent />
          </mesh>
          <mesh position={[0, 1.535, 0]}>
            <boxGeometry args={[0.3, 0.02, 0.02]} />
            <meshStandardMaterial {...FIN.brassDark} transparent />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[0.4, 0.75, 0.035]} />
            <meshStandardMaterial color={g.color} roughness={0.95} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- Quadro em latão na parede lateral ---------- */
function WallArt() {
  const stone = stoneTexture();
  return (
    // Construído no plano XY e rotacionado para a parede lateral (normal +x)
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[1.1, 1.5, 0.04]} />
        <meshStandardMaterial map={woodTexture("#46301c", "#2f1f10", "#5c4024")} roughness={0.55} transparent />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[0.7, 1.1, 0.02]} />
        <meshStandardMaterial map={stone} roughness={0.35} transparent />
      </mesh>
      {/* Moldura em latão */}
      {[
        { pos: [0, 0.76, 0.01] as const, size: [1.14, 0.03, 0.05] as const },
        { pos: [0, -0.76, 0.01] as const, size: [1.14, 0.03, 0.05] as const },
        { pos: [-0.565, 0, 0.01] as const, size: [0.03, 1.55, 0.05] as const },
        { pos: [0.565, 0, 0.01] as const, size: [0.03, 1.55, 0.05] as const },
      ].map((f, i) => (
        <mesh key={i} position={[f.pos[0], f.pos[1], f.pos[2]]}>
          <boxGeometry args={[f.size[0], f.size[1], f.size[2]]} />
          <meshStandardMaterial {...FIN.brass} transparent />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Gôndola central de produtos (dupla face) ---------- */
function Gondola({
  nogueira,
  freijo,
  stone,
}: {
  nogueira: THREE.Texture;
  freijo: THREE.Texture;
  stone: THREE.Texture;
}) {
  return (
    <group>
      <ContactShadow size={[2.4, 1.4]} />
      {/* Base recuada pousa primeiro */}
      <Part position={[0, 0.06, 0]} offset={[0, -0.6, 0]} win={[0, 0.14]}>
        <mesh>
          <boxGeometry args={[1.7, 0.12, 0.7]} />
          <meshStandardMaterial {...FIN.black} transparent />
        </mesh>
      </Part>
      {/* Espinha central sobe */}
      <Part position={[0, 0.72, 0]} offset={[0, -1.0, 0]} win={[0.12, 0.3]}>
        <mesh>
          <boxGeometry args={[1.8, 1.2, 0.18]} />
          <meshStandardMaterial map={nogueira} roughness={0.55} transparent />
        </mesh>
      </Part>
      {/* Laterais entram pelos flancos */}
      {[-0.88, 0.88].map((x, i) => (
        <Part key={i} position={[x, 0.72, 0]} offset={[x > 0 ? 0.7 : -0.7, 0, 0]} win={[0.26, 0.44]}>
          <mesh>
            <boxGeometry args={[0.06, 1.2, 0.8]} />
            <meshStandardMaterial map={nogueira} roughness={0.55} transparent />
          </mesh>
        </Part>
      ))}
      {/* Prateleiras dos dois lados descem nível a nível, com fita de LED */}
      {[0.52, 0.96].map((y, yi) =>
        [-0.24, 0.24].map((z, zi) => {
          const start = 0.42 + (yi * 2 + zi) * 0.08;
          return (
            <Part key={`${y}-${z}`} position={[0, y, z]} offset={[0, 0.7, 0]} win={[start, start + 0.16]}>
              <mesh>
                <boxGeometry args={[1.7, 0.04, 0.3]} />
                <meshStandardMaterial map={freijo} roughness={0.5} transparent />
              </mesh>
              <mesh position={[0, -0.026, z > 0 ? 0.14 : -0.14]}>
                <boxGeometry args={[1.6, 0.012, 0.02]} />
                <meshStandardMaterial {...FIN.led} transparent />
              </mesh>
            </Part>
          );
        })
      )}
      {/* Tampo em pedra fecha por cima */}
      <Part position={[0, 1.345, 0]} offset={[0, 0.7, 0]} win={[0.8, 0.94]}>
        <mesh>
          <boxGeometry args={[1.88, 0.05, 0.88]} />
          <meshStandardMaterial map={stone} roughness={0.3} transparent />
        </mesh>
      </Part>
      {/* Produtos sobre o tampo (superfície em y = 1.37) */}
      <Vase position={[-0.6, 1.37, 0.1]} height={0.24} radius={0.055} color="#d9cfbc" />
      <BookStack position={[0.05, 1.37, -0.08]} />
      <PerfumeBottle position={[0.45, 1.37, 0.12]} />
      <GiftBox position={[0.62, 1.37, -0.12]} size={0.14} color="#b89a6a" />
      {/* Produtos nas prateleiras (superfícies em 0.54 / 0.98) */}
      <FoldedStack position={[-0.45, 0.54, 0.24]} />
      <GiftBox position={[0.4, 0.54, 0.24]} size={0.16} color="#3d3630" />
      <FoldedStack position={[0.45, 0.98, 0.24]} />
      <PerfumeBottle position={[-0.35, 0.98, 0.24]} />
      <FoldedStack position={[0.45, 0.54, -0.24]} />
      <GiftBox position={[-0.45, 0.54, -0.24]} size={0.16} color="#5a4a3a" />
      <FoldedStack position={[-0.45, 0.98, -0.24]} />
      <PerfumeBottle position={[0.35, 0.98, -0.24]} color="#8a6a42" />
    </group>
  );
}

/* ---------- Vitrine expositora em vidro e latão ---------- */
function GlassVitrine({ nogueira, stone }: { nogueira: THREE.Texture; stone: THREE.Texture }) {
  return (
    <group>
      <ContactShadow size={[1.9, 1.1]} />
      {/* Base recuada e corpo em nogueira */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.5]} />
        <meshStandardMaterial {...FIN.black} transparent />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <boxGeometry args={[1.3, 0.46, 0.6]} />
        <meshStandardMaterial map={nogueira} roughness={0.52} transparent />
      </mesh>
      {/* Tampo em pedra */}
      <mesh position={[0, 0.585, 0]}>
        <boxGeometry args={[1.36, 0.05, 0.66]} />
        <meshStandardMaterial map={stone} roughness={0.3} transparent />
      </mesh>
      {/* Redoma de vidro com montantes de latão — montantes sobem primeiro */}
      {[
        [-0.64, -0.305],
        [-0.64, 0.305],
        [0.64, -0.305],
        [0.64, 0.305],
      ].map(([x, z], i) => (
        <Part key={i} position={[x, 0.83, z]} offset={[0, -0.44, 0]} win={[0.46 + i * 0.05, 0.62 + i * 0.05]}>
          <mesh>
            <boxGeometry args={[0.03, 0.44, 0.03]} />
            <meshStandardMaterial {...FIN.brass} transparent />
          </mesh>
        </Part>
      ))}
      {/* Vidros frontal/traseiro fecham em z */}
      {[-0.305, 0.305].map((z, i) => (
        <Part key={i} position={[0, 0.83, z]} offset={[0, 0, z > 0 ? 0.5 : -0.5]} win={[0.66 + i * 0.05, 0.82 + i * 0.05]}>
          <mesh userData={{ baseOpacity: 0.14 }}>
            <boxGeometry args={[1.28, 0.44, 0.015]} />
            <meshStandardMaterial {...FIN.glass} transparent />
          </mesh>
        </Part>
      ))}
      {/* Vidros laterais fecham em x */}
      {[-0.64, 0.64].map((x, i) => (
        <Part key={i} position={[x, 0.83, 0]} offset={[x > 0 ? 0.5 : -0.5, 0, 0]} win={[0.72 + i * 0.05, 0.88 + i * 0.05]}>
          <mesh userData={{ baseOpacity: 0.14 }}>
            <boxGeometry args={[0.015, 0.44, 0.6]} />
            <meshStandardMaterial {...FIN.glass} transparent />
          </mesh>
        </Part>
      ))}
      {/* Tampa de vidro desce e fecha a redoma */}
      <Part position={[0, 1.055, 0]} offset={[0, 0.5, 0]} win={[0.86, 1]}>
        <mesh userData={{ baseOpacity: 0.2 }}>
          <boxGeometry args={[1.31, 0.015, 0.64]} />
          <meshStandardMaterial {...FIN.glass} transparent />
        </mesh>
      </Part>
      {/* Rebordo superior em latão */}
      {[-0.31, 0.31].map((z, i) => (
        <mesh key={`t-${i}`} position={[0, 1.07, z]}>
          <boxGeometry args={[1.34, 0.02, 0.02]} />
          <meshStandardMaterial {...FIN.brass} transparent />
        </mesh>
      ))}
      {[-0.66, 0.66].map((x, i) => (
        <mesh key={`s-${i}`} position={[x, 1.07, 0]}>
          <boxGeometry args={[0.02, 0.02, 0.64]} />
          <meshStandardMaterial {...FIN.brass} transparent />
        </mesh>
      ))}
      {/* Peças expostas dentro da redoma (tampo em y = 0.61) */}
      <mesh position={[-0.3, 0.616, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.012, 18]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <PerfumeBottle position={[-0.34, 0.622, 0.04]} />
      <PerfumeBottle position={[-0.24, 0.622, -0.05]} color="#8a6a42" />
      <GlassSphere position={[0.15, 0.66, 0]} r={0.05} />
      <GiftBox position={[0.4, 0.61, -0.05]} size={0.14} color="#b89a6a" />
    </group>
  );
}

/* ---------- Banco estofado de espera ---------- */
function Bench() {
  return (
    <group>
      <ContactShadow size={[1.6, 0.9]} />
      {[
        [-0.42, -0.14],
        [-0.42, 0.14],
        [0.42, -0.14],
        [0.42, 0.14],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.15, z]}>
          <cylinderGeometry args={[0.016, 0.012, 0.3, 8]} />
          <meshStandardMaterial {...FIN.brass} transparent />
        </mesh>
      ))}
      <mesh position={[0, 0.37, 0]}>
        <boxGeometry args={[1.1, 0.14, 0.42]} />
        <meshStandardMaterial {...FIN.fabric} transparent />
      </mesh>
      <mesh position={[0, 0.47, 0]}>
        <boxGeometry args={[1.04, 0.06, 0.36]} />
        <meshStandardMaterial {...FIN.fabricLight} transparent />
      </mesh>
      {/* Rolinho decorativo numa ponta */}
      <mesh position={[-0.38, 0.545, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.3, 12]} />
        <meshStandardMaterial color="#8a7a64" roughness={0.95} transparent />
      </mesh>
    </group>
  );
}

/* ---------- Prateleiras suspensas na parede principal ---------- */
function FloatingShelves({ freijo }: { freijo: THREE.Texture }) {
  return (
    <group>
      {/* Fundo das prateleiras encosta na face da parede (z -0.03 local) */}
      {[0, -0.55].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[1.6, 0.05, 0.26]} />
            <meshStandardMaterial map={freijo} roughness={0.5} transparent />
          </mesh>
          {/* Mãos-francesas em latão */}
          {[-0.6, 0.6].map((x, j) => (
            <mesh key={j} position={[x, -0.065, 0.07]}>
              <boxGeometry args={[0.02, 0.1, 0.2]} />
              <meshStandardMaterial {...FIN.brass} transparent />
            </mesh>
          ))}
        </group>
      ))}
      {/* Decoração (superfícies em y 0.025 / -0.525) */}
      <Vase position={[-0.5, 0.025, 0.1]} height={0.22} radius={0.05} color="#d9cfbc" />
      <BookStack position={[0.2, 0.025, 0.1]} />
      <SmallPlant position={[0.45, -0.525, 0.1]} />
      <PerfumeBottle position={[-0.3, -0.525, 0.1]} />
      <GlassSphere position={[0.0, -0.465, 0.1]} r={0.05} />
    </group>
  );
}

/* ---------- Cristaleira alta com portas de vidro e LED ---------- */
function TallCabinet({ nogueira, freijo }: { nogueira: THREE.Texture; freijo: THREE.Texture }) {
  return (
    // Construída de frente para +z e girada para a sala (-x)
    <group rotation={[0, -Math.PI / 2, 0]}>
      <ContactShadow size={[2.2, 1.2]} />
      {/* Base recuada */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[1.42, 0.12, 0.5]} />
        <meshStandardMaterial {...FIN.black} transparent />
      </mesh>
      {/* Laterais entram pelos flancos, fundo encosta por trás */}
      {[-0.72, 0.72].map((x, i) => (
        <Part key={i} position={[x, 1.31, 0]} offset={[x > 0 ? 0.7 : -0.7, 0, 0]} win={[0, 0.18]}>
          <mesh>
            <boxGeometry args={[0.06, 2.38, 0.55]} />
            <meshStandardMaterial map={nogueira} roughness={0.55} transparent />
          </mesh>
        </Part>
      ))}
      <Part position={[0, 1.31, -0.255]} offset={[0, 0, -0.6]} win={[0.16, 0.32]}>
        <mesh>
          <boxGeometry args={[1.38, 2.38, 0.04]} />
          <meshStandardMaterial map={nogueira} roughness={0.55} transparent />
        </mesh>
      </Part>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[1.38, 0.06, 0.55]} />
        <meshStandardMaterial map={nogueira} roughness={0.55} transparent />
      </mesh>
      <mesh position={[0, 2.47, 0]}>
        <boxGeometry args={[1.38, 0.06, 0.55]} />
        <meshStandardMaterial map={nogueira} roughness={0.55} transparent />
      </mesh>
      {/* Coroamento em latão */}
      <mesh position={[0, 2.515, 0]}>
        <boxGeometry args={[1.54, 0.03, 0.6]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      {/* Prateleiras internas descem uma a uma, cada uma com seu LED */}
      {[0.7, 1.3, 1.9].map((y, i) => {
        const start = 0.34 + i * 0.14;
        return (
          <Part key={i} position={[0, y, 0]} offset={[0, 1.0, 0]} win={[start, start + 0.16]}>
            <mesh>
              <boxGeometry args={[1.38, 0.04, 0.48]} />
              <meshStandardMaterial map={freijo} roughness={0.5} transparent />
            </mesh>
            <mesh position={[0, -0.026, 0.2]}>
              <boxGeometry args={[1.3, 0.012, 0.02]} />
              <meshStandardMaterial {...FIN.led} transparent />
            </mesh>
          </Part>
        );
      })}
      {/* Portas de vidro emolduradas em latão (face z 0.275) — montadas por último */}
      {[-0.355, 0.355].map((x, i) => (
        <Part key={i} position={[x, 1.31, 0.275]} offset={[0, 0, 0.55]} win={[0.78 + i * 0.08, 0.94 + i * 0.08]}>
          <mesh userData={{ baseOpacity: 0.16 }}>
            <boxGeometry args={[0.66, 2.26, 0.015]} />
            <meshStandardMaterial {...FIN.glass} transparent />
          </mesh>
          {/* Montantes e travessas da porta */}
          {[-0.33, 0.33].map((dx, j) => (
            <mesh key={j} position={[dx, 0, 0]}>
              <boxGeometry args={[0.025, 2.26, 0.025]} />
              <meshStandardMaterial {...FIN.brass} transparent />
            </mesh>
          ))}
          {[-1.13, 1.13].map((dy, j) => (
            <mesh key={`h-${j}`} position={[0, dy, 0]}>
              <boxGeometry args={[0.68, 0.025, 0.025]} />
              <meshStandardMaterial {...FIN.brass} transparent />
            </mesh>
          ))}
          {/* Puxador vertical */}
          <mesh position={[i === 0 ? 0.28 : -0.28, 0, 0.03]}>
            <boxGeometry args={[0.018, 0.32, 0.018]} />
            <meshStandardMaterial {...FIN.brass} transparent />
          </mesh>
        </Part>
      ))}
      {/* Peças expostas (superfícies das prateleiras / piso do móvel) */}
      <Vase position={[-0.35, 0.18, 0.05]} height={0.3} radius={0.07} color="#d9cfbc" />
      <BookStack position={[0.3, 0.18, 0]} />
      <Vase position={[0.35, 0.72, 0.02]} height={0.22} radius={0.05} color="#b89a6a" />
      <PerfumeBottle position={[-0.25, 0.72, 0.05]} />
      <BookStack position={[-0.3, 1.32, 0]} />
      <GlassSphere position={[0.3, 1.38, 0.02]} r={0.05} />
      <Vase position={[0.0, 1.92, 0.02]} height={0.26} radius={0.055} />
      <SmallPlant position={[-0.4, 1.92, 0.02]} />
    </group>
  );
}

/* ---------- Blueprint: linhas técnicas que guiam a montagem ---------- */
type Vec3 = [number, number, number];

function boxLinePoints(w: number, h: number, d: number): Vec3[] {
  const x = w / 2;
  const y = h / 2;
  const z = d / 2;
  const corners: Vec3[] = [
    [-x, -y, -z],
    [x, -y, -z],
    [x, y, -z],
    [-x, y, -z],
    [-x, -y, z],
    [x, -y, z],
    [x, y, z],
    [-x, y, z],
  ];

  return [
    corners[0], corners[1], corners[1], corners[2], corners[2], corners[3], corners[3], corners[0],
    corners[4], corners[5], corners[5], corners[6], corners[6], corners[7], corners[7], corners[4],
    corners[0], corners[4], corners[1], corners[5], corners[2], corners[6], corners[3], corners[7],
  ];
}

function BlueprintBox({
  size,
  position,
}: {
  size: [number, number, number];
  position: Vec3;
}) {
  const points = useMemo(() => boxLinePoints(size[0], size[1], size[2]), [size]);

  return (
    <Line
      segments
      points={points}
      position={position}
      color="#D8B978"
      lineWidth={1.3}
      transparent
      depthWrite={false}
      toneMapped={false}
      userData={{ baseOpacity: 0.42 }}
    />
  );
}

function BlueprintGrid() {
  const { minor, major } = useMemo(() => {
    const size = 18;
    const divisions = 26;
    const half = size / 2;
    const step = size / divisions;
    const minorPoints: Vec3[] = [];
    const majorPoints: Vec3[] = [];

    for (let i = 0; i <= divisions; i += 1) {
      const p = -half + i * step;
      const target = Math.abs(p) < 0.001 ? majorPoints : minorPoints;
      target.push([-half, 0.01, p], [half, 0.01, p], [p, 0.01, -half], [p, 0.01, half]);
    }

    return { minor: minorPoints, major: majorPoints };
  }, []);

  return (
    <>
      <Line
        segments
        points={minor}
        color="#9C7248"
        lineWidth={0.85}
        transparent
        depthWrite={false}
        toneMapped={false}
        userData={{ baseOpacity: 0.22 }}
      />
      <Line
        segments
        points={major}
        color="#D8B978"
        lineWidth={1.05}
        transparent
        depthWrite={false}
        toneMapped={false}
        userData={{ baseOpacity: 0.32 }}
      />
    </>
  );
}

function BlueprintQualityBoost({ progress, mobile }: { progress: Progress; mobile: boolean }) {
  const { gl } = useThree();
  const current = useRef(0);

  useFrame(() => {
    const p = progress.get();
    const boosted = p < 0.4;
    const next = boosted ? (mobile ? 1.85 : 2.15) : sceneDpr(mobile)[0];
    if (Math.abs(current.current - next) < 0.01) return;
    gl.setPixelRatio(next);
    current.current = next;
  });

  return null;
}

function Blueprint({ progress }: { progress: Progress }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const p = progress.get();
    const o = 1 - clamp01((p - 0.16) / 0.22);
    g.visible = o > 0.01;
    g.traverse((obj) => {
      const anyObj = obj as THREE.Mesh;
      if (!anyObj.material) return;
      const m = anyObj.material as THREE.Material;
      m.transparent = true;
      m.opacity = o * ((obj.userData.baseOpacity as number | undefined) ?? 0.45);
    });
  });

  return (
    <group ref={ref}>
      <BlueprintGrid />
      <BlueprintBox size={[3.9, 1.14, 1.3]} position={[0, 0.57, 1.2]} />
      <BlueprintBox size={[0.3, 3.3, 4.4]} position={[-3.2, 1.65, -1]} />
      <BlueprintBox size={[2.6, 2.3, 0.6]} position={[3.1, 1.15, -1.7]} />
      <BlueprintBox size={[0.9, 2.4, 0.9]} position={[1.7, 1.2, -2.7]} />
      <BlueprintBox size={[1.8, 0.85, 0.55]} position={[-1.6, 0.55, -3.5]} />
      <BlueprintBox size={[1.6, 1.65, 0.5]} position={[4.3, 0.85, 0.8]} />
      <BlueprintBox size={[2.9, 0.02, 1.9]} position={[-3.6, 0.02, 2.6]} />
      <BlueprintBox size={[1.1, 0.85, 1.1]} position={[2.6, 0.43, 3.4]} />
      <BlueprintBox size={[1.9, 1.4, 0.9]} position={[-0.6, 0.7, -2.4]} />
      <BlueprintBox size={[1.4, 1.1, 0.7]} position={[3.0, 0.55, 1.7]} />
      <BlueprintBox size={[0.6, 2.55, 1.6]} position={[6.0, 1.27, -2.0]} />
    </group>
  );
}

/* ---------- Logo abstrato da marca em latão ---------- */
function BrandMark() {
  return (
    <group>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, -0.3]}>
        <torusGeometry args={[0.3, 0.028, 14, 44]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <mesh position={[0, 0, 0.32]}>
        <boxGeometry args={[0.055, 0.62, 0.055]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[0.045, 0.018, 1.0]} />
        <meshStandardMaterial {...FIN.brass} transparent />
      </mesh>
    </group>
  );
}

/* ---------- Câmera: aproximação suave + balanço final limitado ----------
   O balanço final é uma oscilação senoidal LIMITADA (±0.32 rad).
   Antes era um giro acumulativo infinito que levava a câmera para
   trás das paredes — a tela ficava coberta pela parede (tudo escuro). */
function CameraRig({ progress }: { progress: Progress }) {
  const { camera, size } = useThree();

  useFrame((state) => {
    const p = progress.get();
    const settle = clamp01((p - 0.88) / 0.12);
    const sway = Math.sin(state.clock.elapsedTime * 0.22) * 0.32 * settle;
    const angle = -0.55 + p * 0.7 + sway;
    // Telas retrato (mobile) têm FOV horizontal estreito — a loja larga
    // ficaria cortada nas laterais. Afastamos a câmera na proporção em que a
    // tela é mais alta que larga, mantendo o balcão e a parede enquadrados.
    const aspect = size.width / Math.max(1, size.height);
    const fit = aspect < 1.5 ? Math.min(1.5 / aspect, 1.7) : 1;
    const radius = (9.4 - p * 2.6) * fit;
    const height = (3.4 - p * 1.0) * (fit > 1 ? 1.06 : 1);
    camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    camera.lookAt(0, 1.1, 0);
  });

  return null;
}

/* ---------- A cena completa ---------- */
function AssemblyScene({ progress }: { progress: Progress }) {
  const mobile = useMemo(() => isMobileViewport(), []);

  const T = useMemo(
    () => ({
      freijo: woodTexture("#7a4e2c", "#5a3a20", "#8f6038"),
      freijoSlat: woodTexture("#7a4e2c", "#5a3a20", "#8f6038", [0.25, 1]),
      nogueira: woodTexture("#46301c", "#2f1f10", "#5c4024"),
      nogueiraWide: woodTexture("#46301c", "#2f1f10", "#5c4024", [2, 0.6]),
      stone: stoneTexture(),
      floor: floorTexture([3.5, 3]),
    }),
    []
  );

  const pendantLight = useRef<THREE.PointLight>(null);
  const coveLight = useRef<THREE.PointLight>(null);
  const panelLight = useRef<THREE.PointLight>(null);

  const slatCount = mobile ? 9 : 16;
  const fluteCount = mobile ? 10 : 18;

  return (
    <>
      <fog attach="fog" args={["#080706", 13, 28]} />
      <ambientLight intensity={0.3} color="#f4e8d4" />
      <hemisphereLight args={["#3a3228", "#0c0a08", 0.35]} />
      {/* Luz principal quente com sombras dinâmicas */}
      <directionalLight
        position={[6, 9, 4]}
        intensity={1.5}
        color="#ffd9a6"
        castShadow={!mobile}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-radius={2}
        shadow-blurSamples={6}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
      />
      <directionalLight position={[-7, 4, -3]} intensity={0.25} color="#8a7a64" />

      {/* Reflexos de ambiente (softboxes virtuais — metais, vidro e pedra
          ganham brilho realista sem baixar nenhum HDR externo) */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2.2} color="#ffdcae" position={[0, 4, -4]} scale={[7, 3, 1]} />
        <Lightformer intensity={0.9} color="#b0a290" position={[-5, 2, 2]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} />
        <Lightformer intensity={0.7} color="#6e7a86" position={[5, 3, 4]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
        <Lightformer intensity={0.4} color="#2a2017" position={[0, -3, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
      </Environment>
      <RealismTuning enableShadows={!mobile} />
      <BlueprintQualityBoost progress={progress} mobile={mobile} />

      <CameraRig progress={progress} />
      <Blueprint progress={progress} />

      {/* ===== Piso porcelanato — surge de baixo (20%) ===== */}
      <Piece progress={progress} window={[0.12, 0.26]} from={[0, -2.5, 0]} to={[0, 0, 0]}>
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[14, 0.12, 12]} />
          <meshStandardMaterial map={T.floor} roughness={0.38} metalness={0.12} transparent />
        </mesh>
      </Piece>

      {/* ===== Parede principal com boiserie em madeira ===== */}
      <Piece progress={progress} window={[0.16, 0.3]} from={[0, 4.5, -4.6]} to={[0, 1.8, -4.6]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[14, 3.0, 0.2]} />
          <meshStandardMaterial {...FIN.matteWall} transparent />
        </mesh>
        <mesh position={[0, -1.2, 0.04]}>
          <boxGeometry args={[14, 1.2, 0.26]} />
          <meshStandardMaterial map={T.nogueiraWide} roughness={0.5} transparent />
        </mesh>
        <mesh position={[0, -0.58, 0.04]}>
          <boxGeometry args={[14, 0.025, 0.27]} />
          <meshStandardMaterial {...FIN.brass} transparent />
        </mesh>
        <mesh position={[0, -1.74, 0.08]}>
          <boxGeometry args={[14, 0.14, 0.24]} />
          <meshStandardMaterial {...FIN.black} transparent />
        </mesh>
        {/* Frisos verticais de latão emoldurando a área do balcão */}
        {[-2.8, 2.8].map((x, i) => (
          <mesh key={i} position={[x, 0.75, 0.115]}>
            <boxGeometry args={[0.03, 2.4, 0.02]} />
            <meshStandardMaterial {...FIN.brass} transparent />
          </mesh>
        ))}
      </Piece>

      {/* ===== Parede lateral ===== */}
      <Piece progress={progress} window={[0.19, 0.33]} from={[-9.5, 1.8, 0]} to={[-6, 1.8, 0]}>
        <mesh>
          <boxGeometry args={[0.2, 4.2, 12]} />
          <meshStandardMaterial color="#171310" roughness={0.92} transparent />
        </mesh>
        <mesh position={[0.06, -1.74, 0]}>
          <boxGeometry args={[0.22, 0.14, 12]} />
          <meshStandardMaterial {...FIN.black} transparent />
        </mesh>
      </Piece>

      {/* ===== Painel ripado retroiluminado — entra pela esquerda (35%) ===== */}
      <Piece
        progress={progress}
        window={[0.3, 0.44]}
        from={[-9, 0, -1]}
        to={[-3.2, 0, -1]}
        rotFrom={-0.6}
      >
        {/* Caixa de fundo: primeira a assentar (vem de trás) */}
        <Part position={[-0.12, 1.65, 0]} offset={[-0.5, 0, 0]} win={[0, 0.18]}>
          <mesh>
            <boxGeometry args={[0.06, 3.3, 4.4]} />
            <meshStandardMaterial color="#120d09" roughness={0.9} transparent />
          </mesh>
        </Part>
        <mesh position={[-0.08, 1.65, 0]} rotation={[0, Math.PI / 2, 0]} userData={{ baseOpacity: 0.55 }}>
          <planeGeometry args={[4.3, 3.2]} />
          <meshStandardMaterial
            color="#3a2a16"
            emissive="#b97f3e"
            emissiveIntensity={0.5}
            transparent
          />
        </mesh>
        {/* Ripas instaladas uma a uma, da esquerda para a direita */}
        {Array.from({ length: slatCount }).map((_, i) => {
          const start = 0.14 + (i / slatCount) * 0.62;
          return (
            <Part
              key={i}
              position={[0, 1.65, -2.05 + i * (4.1 / (slatCount - 1))]}
              offset={[0.95, 0, 0]}
              win={[start, Math.min(1, start + 0.2)]}
            >
              <mesh>
                <boxGeometry args={[0.14, 3.25, 0.11]} />
                <meshStandardMaterial map={T.freijoSlat} roughness={0.5} transparent />
              </mesh>
            </Part>
          );
        })}
        {/* Arremates de latão: descem/sobem por último, fechando o conjunto */}
        <Part position={[0.02, 3.3, 0]} offset={[0, 0.6, 0]} win={[0.82, 1]}>
          <mesh>
            <boxGeometry args={[0.18, 0.035, 4.35]} />
            <meshStandardMaterial {...FIN.brass} transparent />
          </mesh>
        </Part>
        <Part position={[0.02, 0.05, 0]} offset={[0, -0.6, 0]} win={[0.82, 1]}>
          <mesh>
            <boxGeometry args={[0.18, 0.06, 4.35]} />
            <meshStandardMaterial {...FIN.brassDark} transparent />
          </mesh>
        </Part>
      </Piece>

      {/* ===== Balcão central: pedra em cascata + frente frisada (50%) ===== */}
      <Piece
        progress={progress}
        window={[0.44, 0.58]}
        from={[0, 0, 8]}
        to={[0, 0, 1.2]}
        rotFrom={0.35}
      >
        <ContactShadow size={[5.2, 2.4]} />
        {/* Rodapé de latão assenta primeiro */}
        <Part position={[0, 0.06, 0]} offset={[0, -0.7, 0]} win={[0, 0.16]}>
          <mesh>
            <boxGeometry args={[3.3, 0.12, 0.82]} />
            <meshStandardMaterial {...FIN.brassDark} transparent />
          </mesh>
        </Part>
        {/* Corpo do balcão sobe e trava sobre o rodapé */}
        <Part position={[0, 0.56, 0]} offset={[0, -0.9, 0]} win={[0.12, 0.34]}>
          <mesh>
            <boxGeometry args={[3.6, 0.92, 1.0]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.52} transparent />
          </mesh>
        </Part>
        {/* Friso a friso na frente do balcão */}
        {Array.from({ length: fluteCount }).map((_, i) => {
          const start = 0.28 + (i / fluteCount) * 0.42;
          return (
            <Part
              key={i}
              position={[-1.62 + i * (3.24 / (fluteCount - 1)), 0.56, 0.53]}
              offset={[0, 0, 0.55]}
              win={[start, Math.min(1, start + 0.18)]}
            >
              <mesh>
                <boxGeometry args={[0.13, 0.88, 0.055]} />
                <meshStandardMaterial map={T.freijoSlat} roughness={0.5} transparent />
              </mesh>
            </Part>
          );
        })}
        {/* Laterais de pedra deslizam pelos flancos */}
        <Part position={[-1.91, 0.55, 0]} offset={[-0.8, 0, 0]} win={[0.5, 0.68]}>
          <mesh>
            <boxGeometry args={[0.08, 1.1, 1.3]} />
            <meshStandardMaterial map={T.stone} roughness={0.3} transparent />
          </mesh>
        </Part>
        <Part position={[1.91, 0.55, 0]} offset={[0.8, 0, 0]} win={[0.5, 0.68]}>
          <mesh>
            <boxGeometry args={[0.08, 1.1, 1.3]} />
            <meshStandardMaterial map={T.stone} roughness={0.3} transparent />
          </mesh>
        </Part>
        {/* Tampo de pedra em cascata desce e fecha o conjunto */}
        <Part position={[0, 1.06, 0]} offset={[0, 1.1, 0]} win={[0.66, 0.84]}>
          <mesh>
            <boxGeometry args={[3.9, 0.08, 1.3]} />
            <meshStandardMaterial map={T.stone} roughness={0.3} metalness={0.05} transparent />
          </mesh>
        </Part>
        {/* Fita de LED sob a aba acende por último */}
        <Part position={[0, 0.99, 0.56]} offset={[0, 0, 0.25]} win={[0.84, 0.96]}>
          <mesh>
            <boxGeometry args={[3.5, 0.025, 0.03]} />
            <meshStandardMaterial {...FIN.led} transparent />
          </mesh>
        </Part>
        {/* Decoração pousa sobre o tampo no fim (tampo termina em y=1.10) */}
        <Part position={[1.25, 1.1, 0.1]} offset={[0, 0.5, 0]} win={[0.86, 1]}>
          <Vase position={[0, 0, 0]} height={0.3} radius={0.07} color="#d9cfbc" />
        </Part>
        <Part position={[-1.15, 1.1, 0.05]} offset={[0, 0.5, 0]} win={[0.88, 1]}>
          <BookStack position={[0, 0, 0]} />
          {/* Esfera de latão apoiada SOBRE a pilha de livros */}
          <mesh position={[0.02, 0.125, 0]}>
            <sphereGeometry args={[0.045, 14, 10]} />
            <meshStandardMaterial {...FIN.brass} transparent />
          </mesh>
        </Part>
        {/* Bandeja de latão com perfumes (tampo 1.10 → bandeja 1.108 → frascos 1.116) */}
        <Part position={[0.5, 1.108, 0.05]} offset={[0, 0.5, 0]} win={[0.9, 1]}>
          <mesh>
            <cylinderGeometry args={[0.17, 0.17, 0.015, 20]} />
            <meshStandardMaterial {...FIN.brass} transparent />
          </mesh>
          <PerfumeBottle position={[-0.08, 0.008, -0.05]} />
          <PerfumeBottle position={[0.06, 0.008, 0.05]} color="#8a6a42" />
        </Part>
        <Part position={[-0.55, 1.1, -0.25]} offset={[0, 0.5, 0]} win={[0.9, 1]}>
          <SmallPlant position={[0, 0, 0]} />
        </Part>
      </Piece>

      {/* ===== Banquetas em frente ao balcão ===== */}
      <Piece progress={progress} window={[0.5, 0.62]} from={[0, 0, 9]} to={[0, 0, 2.35]}>
        <ContactShadow size={[2.6, 1.0]} />
        <Stool position={[-0.7, 0, 0]} />
        <Stool position={[0.7, 0, 0]} />
      </Piece>

      {/* ===== Estante lateral com LED e decoração (65%) ===== */}
      <Piece
        progress={progress}
        window={[0.56, 0.68]}
        from={[8, 0, -1.7]}
        to={[3.1, 0, -1.7]}
        rotFrom={0.5}
      >
        <ContactShadow size={[3.4, 1.4]} />
        {/* Laterais entram pelos flancos */}
        <Part position={[-1.27, 1.2, 0]} offset={[-0.7, 0, 0]} win={[0, 0.2]}>
          <mesh>
            <boxGeometry args={[0.07, 2.3, 0.56]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.55} transparent />
          </mesh>
        </Part>
        <Part position={[1.27, 1.2, 0]} offset={[0.7, 0, 0]} win={[0, 0.2]}>
          <mesh>
            <boxGeometry args={[0.07, 2.3, 0.56]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.55} transparent />
          </mesh>
        </Part>
        {/* Fundo encosta por trás, travando as laterais */}
        <Part position={[0, 1.2, -0.26]} offset={[0, 0, -0.6]} win={[0.18, 0.36]}>
          <mesh>
            <boxGeometry args={[2.6, 2.3, 0.06]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.55} transparent />
          </mesh>
        </Part>
        {/* Prateleiras descem e travam, de baixo para cima, cada uma com seu LED */}
        {[0.65, 1.25, 1.85].map((y, i) => {
          const start = 0.36 + i * 0.16;
          return (
            <Part key={i} position={[0, y, 0]} offset={[0, 1.2, 0]} win={[start, start + 0.18]}>
              <mesh>
                <boxGeometry args={[2.48, 0.055, 0.52]} />
                <meshStandardMaterial map={T.freijo} roughness={0.5} transparent />
              </mesh>
              <mesh position={[0, -0.035, 0.16]}>
                <boxGeometry args={[2.3, 0.012, 0.02]} />
                <meshStandardMaterial {...FIN.led} transparent />
              </mesh>
            </Part>
          );
        })}
        {/* Decoração — alturas calculadas para apoiar no topo de cada
            prateleira (y + 0.0275) sem invadir a prateleira de cima */}
        <Vase position={[-0.8, 0.68, 0.05]} height={0.28} />
        <GlassSphere position={[0.2, 0.74, 0.08]} />
        <BookStack position={[0.85, 0.68, 0]} />
        <PerfumeBottle position={[-0.3, 0.68, 0.1]} />
        <PerfumeBottle position={[-0.18, 0.68, 0.02]} color="#8a6a42" />
        <Vase position={[0.7, 1.28, 0.05]} height={0.22} radius={0.05} color="#b89a6a" />
        <BranchVase position={[-0.7, 1.28, 0]} scale={0.6} />
        <MiniFrame position={[0.05, 1.28, 0.02]} />
        <BookStack position={[-0.1, 1.88, 0]} />
        <Vase position={[0.85, 1.88, 0.02]} height={0.26} radius={0.055} />
        <SmallPlant position={[-0.8, 1.88, 0.02]} />
        {/* Linha de cosméticos (prateleira de baixo, superfície em 0.6775) */}
        {[0.35, 0.45, 0.55].map((x, i) => (
          <mesh key={i} position={[x, 0.7475, -0.12]}>
            <cylinderGeometry args={[0.028, 0.03, 0.14, 12]} />
            <meshStandardMaterial
              color={["#e6ddcc", "#caa86a", "#3d3630"][i]}
              roughness={0.35}
              transparent
            />
          </mesh>
        ))}
        {/* Cesto decorativo ao lado da estante */}
        <Basket position={[-1.1, 0, 0.85]} />
      </Piece>

      {/* ===== Lounge de atendimento: tapete, poltronas e mesa lateral ===== */}
      <Piece progress={progress} window={[0.58, 0.7]} from={[-3.6, 0, 9]} to={[-3.6, 0, 2.6]}>
        {/* Tapete */}
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[2.9, 0.02, 1.9]} />
          <meshStandardMaterial color="#54493d" roughness={1} transparent />
        </mesh>
        {/* Poltronas frente a frente */}
        <Armchair position={[-0.95, 0.02, 0]} rotationY={Math.PI / 2} />
        <Armchair position={[0.95, 0.02, 0]} rotationY={-Math.PI / 2} />
        <SideTable position={[0, 0.02, 0]} />
        {/* Luminária de piso no canto do lounge */}
        <FloorLamp position={[1.55, 0, -0.55]} />
      </Piece>

      {/* ===== Torre expositora em vidro e latão ===== */}
      <Piece progress={progress} window={[0.6, 0.72]} from={[1.7, 5, -2.7]} to={[1.7, 0, -2.7]}>
        <ContactShadow size={[1.6, 1.6]} />
        {/* Base pousa primeiro */}
        <Part position={[0, 0.1, 0]} offset={[0, -0.7, 0]} win={[0, 0.16]}>
          <mesh>
            <boxGeometry args={[0.9, 0.2, 0.9]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.5} transparent />
          </mesh>
        </Part>
        {/* Montantes de latão sobem um a um */}
        {[
          [-0.42, -0.42],
          [-0.42, 0.42],
          [0.42, -0.42],
          [0.42, 0.42],
        ].map(([x, z], i) => {
          const start = 0.14 + i * 0.1;
          return (
            <Part key={i} position={[x, 1.25, z]} offset={[0, -2.1, 0]} win={[start, start + 0.16]}>
              <mesh>
                <boxGeometry args={[0.04, 2.1, 0.04]} />
                <meshStandardMaterial {...FIN.brass} transparent />
              </mesh>
            </Part>
          );
        })}
        {/* Vidros fecham as quatro faces */}
        {[
          { pos: [0, 1.25, 0.43] as const, rot: 0, off: [0, 0, 0.5] as const },
          { pos: [0, 1.25, -0.43] as const, rot: 0, off: [0, 0, -0.5] as const },
          { pos: [0.43, 1.25, 0] as const, rot: Math.PI / 2, off: [0.5, 0, 0] as const },
          { pos: [-0.43, 1.25, 0] as const, rot: Math.PI / 2, off: [-0.5, 0, 0] as const },
        ].map((g, i) => (
          <Part
            key={i}
            position={[g.pos[0], g.pos[1], g.pos[2]]}
            rotation={[0, g.rot, 0]}
            offset={g.off}
            win={[0.54 + i * 0.05, 0.74 + i * 0.05]}
          >
            <mesh userData={{ baseOpacity: 0.14 }}>
              <boxGeometry args={[0.82, 2.1, 0.015]} />
              <meshStandardMaterial {...FIN.glass} transparent />
            </mesh>
          </Part>
        ))}
        {/* Prateleiras de vidro descem com a peça exposta */}
        {[0.95, 1.7].map((y, i) => (
          <Part key={i} position={[0, y, 0]} offset={[0, 0.9, 0]} win={[0.74 + i * 0.08, 0.92 + i * 0.08]}>
            <mesh userData={{ baseOpacity: 0.25 }}>
              <boxGeometry args={[0.78, 0.018, 0.78]} />
              <meshStandardMaterial {...FIN.glass} transparent />
            </mesh>
            <Vase
              position={[0, 0.01, 0]}
              height={0.22}
              radius={0.05}
              color={i === 0 ? "#d9cfbc" : "#b89a6a"}
            />
          </Part>
        ))}
        {/* Tampo e LED de coroamento por último */}
        <Part position={[0, 2.35, 0]} offset={[0, 0.6, 0]} win={[0.88, 1]}>
          <mesh>
            <boxGeometry args={[0.9, 0.1, 0.9]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.5} transparent />
          </mesh>
          <mesh position={[0, -0.07, 0]}>
            <boxGeometry args={[0.5, 0.02, 0.5]} />
            <meshStandardMaterial {...FIN.led} transparent />
          </mesh>
        </Part>
      </Piece>

      {/* ===== Mesa expositora redonda com produtos ===== */}
      <Piece progress={progress} window={[0.54, 0.66]} from={[2.6, 0, 9.5]} to={[2.6, 0, 3.4]} rotFrom={-0.3}>
        <DisplayTable freijo={T.freijo} stone={T.stone} />
      </Piece>

      {/* ===== Gôndola central de produtos — desce do alto ===== */}
      <Piece progress={progress} window={[0.55, 0.67]} from={[-0.6, 5, -2.4]} to={[-0.6, 0, -2.4]} rotFrom={0.3}>
        <Gondola nogueira={T.nogueira} freijo={T.freijo} stone={T.stone} />
      </Piece>

      {/* ===== Vitrine expositora em vidro e latão — entra pela direita ===== */}
      <Piece progress={progress} window={[0.57, 0.69]} from={[9.5, 0, 1.7]} to={[3.0, 0, 1.7]} rotFrom={0.4}>
        <GlassVitrine nogueira={T.nogueira} stone={T.stone} />
      </Piece>

      {/* ===== Canto direito: cristaleira alta de frente para a sala
            (nichos da parede vão até x 5.55; estante termina em x 4.4) ===== */}
      <Piece progress={progress} window={[0.61, 0.73]} from={[9.8, 0, -2.0]} to={[6.0, 0, -2.0]}>
        <TallCabinet nogueira={T.nogueira} freijo={T.freijo} />
      </Piece>

      {/* ===== Canto direito frontal: poltrona + mesinha de apoio ===== */}
      {!mobile && (
        <Piece progress={progress} window={[0.67, 0.78]} from={[5.4, 0, 9.8]} to={[5.4, 0, 3.5]}>
          {/* Poltrona girada para o centro da loja */}
          <ContactShadow size={[1.3, 1.3]} />
          <Armchair position={[0, 0.02, 0]} rotationY={-2.15} />
          <SideTable position={[-0.85, 0.02, 0.45]} />
        </Piece>
      )}

      {/* ===== Planta de piso entre a arara e a cristaleira ===== */}
      {!mobile && (
        <Piece progress={progress} window={[0.7, 0.8]} from={[6.1, 4.5, 0.6]} to={[6.1, 0, 0.6]}>
          <group scale={0.9}>
            <FloorPlant position={[0, 0, 0]} />
          </group>
        </Piece>
      )}

      {/* ===== Banco estofado de espera — em frente ao lounge, longe do
            painel ripado (o painel ocupa x ≈ -3.3…-3.1 até z 1.2) ===== */}
      {!mobile && (
        <Piece progress={progress} window={[0.66, 0.77]} from={[-1.4, 0, 9]} to={[-1.4, 0, 3.3]}>
          <Bench />
        </Piece>
      )}

      {/* ===== Prateleiras suspensas na parede principal ===== */}
      {!mobile && (
        <Piece progress={progress} window={[0.72, 0.82]} from={[1.05, 5.5, -4.47]} to={[1.05, 2.35, -4.47]}>
          <FloatingShelves freijo={T.freijo} />
        </Piece>
      )}

      {/* ===== Arara de roupas em latão — entra pela direita ===== */}
      <Piece progress={progress} window={[0.62, 0.74]} from={[9.5, 0, 0.8]} to={[4.3, 0, 0.8]} rotFrom={0.4}>
        <ClothingRack />
        {/* Caixas de compras empilhadas ao pé da arara */}
        <group position={[0.75, 0, -0.65]}>
          <ContactShadow size={[0.8, 0.8]} />
          <GiftBox position={[0, 0, 0]} size={0.3} color="#3d3630" />
          <GiftBox position={[0.02, 0.18, 0.02]} size={0.22} color="#b89a6a" />
          <GiftBox position={[0.32, 0, -0.1]} size={0.18} color="#5a4a3a" />
        </group>
      </Piece>

      {/* ===== Busto de manequim ao lado da arara ===== */}
      {!mobile && (
        <Piece progress={progress} window={[0.63, 0.74]} from={[9.5, 0, 2.4]} to={[4.7, 0, 2.4]}>
          <MannequinBust position={[0, 0, 0]} />
        </Piece>
      )}

      {/* ===== Espelho de piso na parede lateral ===== */}
      {!mobile && (
        <Piece progress={progress} window={[0.69, 0.79]} from={[-9.5, 0, 0.4]} to={[-5.72, 0, 0.4]}>
          <FloorMirror />
        </Piece>
      )}

      {/* ===== Credenza suspensa em pés de latão ===== */}
      <Piece progress={progress} window={[0.64, 0.75]} from={[-1.6, 0, 7]} to={[-1.6, 0, -3.5]}>
        <ContactShadow size={[2.4, 1.1]} />
        {/* Pés de latão fincam primeiro */}
        {[
          [-0.78, -0.2],
          [-0.78, 0.2],
          [0.78, -0.2],
          [0.78, 0.2],
        ].map(([x, z], i) => (
          <Part key={i} position={[x, 0.155, z]} offset={[0, -0.45, 0]} win={[0, 0.18]}>
            <mesh>
              <cylinderGeometry args={[0.018, 0.014, 0.31, 10]} />
              <meshStandardMaterial {...FIN.brass} transparent />
            </mesh>
          </Part>
        ))}
        {/* Corpo desce e pousa sobre os pés */}
        <Part position={[0, 0.62, 0]} offset={[0, 0.8, 0]} win={[0.18, 0.42]}>
          <mesh>
            <boxGeometry args={[1.8, 0.62, 0.55]} />
            <meshStandardMaterial map={T.freijo} roughness={0.5} transparent />
          </mesh>
          <mesh position={[0, 0, 0.28]}>
            <boxGeometry args={[0.015, 0.58, 0.012]} />
            <meshStandardMaterial color="#1a120a" roughness={0.8} transparent />
          </mesh>
        </Part>
        {/* Tampo de pedra fecha o corpo */}
        <Part position={[0, 0.95, 0]} offset={[0, 0.6, 0]} win={[0.42, 0.6]}>
          <mesh>
            <boxGeometry args={[1.86, 0.04, 0.6]} />
            <meshStandardMaterial map={T.stone} roughness={0.3} transparent />
          </mesh>
        </Part>
        {/* Puxadores são fixados na frente das portas */}
        {[-0.12, 0.12].map((x, i) => (
          <Part key={i} position={[x, 0.62, 0.295]} offset={[0, 0, 0.3]} win={[0.6, 0.76]}>
            <mesh>
              <boxGeometry args={[0.035, 0.34, 0.025]} />
              <meshStandardMaterial {...FIN.brass} transparent />
            </mesh>
          </Part>
        ))}
        {/* Decoração pousa no tampo (y=0.97) por último */}
        <Part position={[-0.55, 0.97, 0]} offset={[0, 0.45, 0]} win={[0.78, 1]}>
          <BranchVase position={[0, 0, 0]} />
        </Part>
        <Part position={[0.1, 0.97, 0.02]} offset={[0, 0.45, 0]} win={[0.82, 1]}>
          <BookStack position={[0, 0, 0]} />
        </Part>
        <Part position={[0.6, 0.97, -0.05]} offset={[0, 0.45, 0]} win={[0.86, 1]}>
          <TableLamp position={[0, 0, 0]} />
        </Part>
      </Piece>

      {/* ===== Plantas de piso ===== */}
      <Piece progress={progress} window={[0.68, 0.79]} from={[-5.0, 4.5, -3.0]} to={[-5.0, 0, -3.0]}>
        <FloorPlant position={[0, 0, 0]} />
      </Piece>
      {!mobile && (
        <Piece progress={progress} window={[0.7, 0.8]} from={[-5.1, 4.5, 1.8]} to={[-5.1, 0, 1.8]}>
          <group scale={0.78}>
            <FloorPlant position={[0, 0, 0]} />
          </group>
        </Piece>
      )}

      {/* ===== Quadros e relógio na parede principal ===== */}
      <Piece progress={progress} window={[0.71, 0.81]} from={[0, 5.5, -4.47]} to={[0, 0, -4.47]}>
        <group position={[-2.05, 2.05, 0]}>
          <FramedArt w={0.75} h={0.95} tone="#4a4036" />
        </group>
        <group position={[-1.15, 2.05, 0]}>
          <FramedArt w={0.6} h={0.75} tone="#6b5a44" />
        </group>
        <group position={[2.3, 2.4, 0]}>
          <WallClock />
        </group>
      </Piece>

      {/* ===== Quadro na parede lateral ===== */}
      <Piece progress={progress} window={[0.7, 0.8]} from={[-9.5, 2.1, 2.6]} to={[-5.86, 2.1, 2.6]}>
        <WallArt />
      </Piece>

      {/* ===== Nichos retroiluminados (caixas OCAS — nada atravessa) ===== */}
      <Piece progress={progress} window={[0.66, 0.78]} from={[4.6, 5.4, -4.28]} to={[4.6, 2.4, -4.28]}>
        {[
          [-0.5, 0.45],
          [0.5, 0.45],
          [0, -0.5],
        ].map(([x, y], i) => (
          <group key={i} position={[x, y, 0]}>
            {/* Topo e base */}
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[0.85, 0.045, 0.4]} />
              <meshStandardMaterial map={T.nogueira} roughness={0.55} transparent />
            </mesh>
            <mesh position={[0, -0.4, 0]}>
              <boxGeometry args={[0.85, 0.045, 0.4]} />
              <meshStandardMaterial map={T.nogueira} roughness={0.55} transparent />
            </mesh>
            {/* Laterais */}
            <mesh position={[-0.4, 0, 0]}>
              <boxGeometry args={[0.045, 0.85, 0.4]} />
              <meshStandardMaterial map={T.nogueira} roughness={0.55} transparent />
            </mesh>
            <mesh position={[0.4, 0, 0]}>
              <boxGeometry args={[0.045, 0.85, 0.4]} />
              <meshStandardMaterial map={T.nogueira} roughness={0.55} transparent />
            </mesh>
            {/* Fundo iluminado — afastado da parede (z -0.12) para nunca
                ficar coplanar com ela (coplanar = z-fighting/chuvisco) */}
            <mesh position={[0, 0, -0.12]} userData={{ baseOpacity: 0.85, noShadow: true }}>
              <planeGeometry args={[0.76, 0.76]} />
              <meshStandardMaterial
                color="#2a1d10"
                emissive="#c98e4a"
                emissiveIntensity={0.9}
                transparent
              />
            </mesh>
            {/* Filete de latão na boca do nicho */}
            <mesh position={[0, -0.367, 0.195]}>
              <boxGeometry args={[0.76, 0.018, 0.012]} />
              <meshStandardMaterial {...FIN.brass} transparent />
            </mesh>
            {/* Peça exposta APOIADA na base interna do nicho */}
            <Vase position={[0, -0.3775, 0.02]} height={0.24} radius={0.05} />
          </group>
        ))}
      </Piece>

      {/* ===== Iluminação cênica: teto, sanca e pendentes (80%) ===== */}
      <Piece
        progress={progress}
        window={[0.76, 0.9]}
        from={[0, 6.2, 0]}
        to={[0, 4.05, 0]}
        onUpdate={(t) => {
          if (pendantLight.current) pendantLight.current.intensity = t * 2.0;
          if (coveLight.current) coveLight.current.intensity = t * 1.4;
          if (panelLight.current) panelLight.current.intensity = t * 1.6;
        }}
      >
        {/* O forro NÃO pode projetar sombra: ele fica entre a luz principal
            (que vem de cima) e a loja inteira — se projetar, escurece tudo
            e gera listras serrilhadas nos móveis. */}
        <mesh userData={{ noShadow: true }}>
          <boxGeometry args={[14, 0.1, 12]} />
          <meshStandardMaterial color="#0d0a08" roughness={0.95} transparent />
        </mesh>
        <mesh position={[0, -0.12, -4.35]} userData={{ noShadow: true }}>
          <boxGeometry args={[13.4, 0.03, 0.08]} />
          <meshStandardMaterial {...FIN.led} transparent />
        </mesh>
        {/* Spots embutidos sobre os móveis principais */}
        {[
          [-3.2, -1],
          [3.1, -1.7],
          [1.7, -2.7],
          [-3.6, 2.6],
          [2.6, 3.4],
          [4.3, 0.8],
          [0, 1.2],
          [-0.6, -2.4],
          [3.0, 1.7],
          [6.0, -2.0],
          [5.4, 3.5],
        ].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, -0.07, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.05, 14]} />
              <meshStandardMaterial {...FIN.black} transparent />
            </mesh>
            <mesh position={[0, -0.096, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.01, 14]} />
              <meshStandardMaterial
                color="#ffe7c2"
                emissive="#ffc987"
                emissiveIntensity={1.8}
                transparent
              />
            </mesh>
          </group>
        ))}
        {[-1.1, 0, 1.1].map((x, i) => (
          <group key={i} position={[x, 0, -2.85]}>
            <mesh position={[0, -0.65, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 1.3, 6]} />
              <meshStandardMaterial color="#1a1410" roughness={0.6} transparent />
            </mesh>
            <mesh position={[0, -1.32, 0]}>
              <cylinderGeometry args={[0.035, 0.05, 0.08, 12]} />
              <meshStandardMaterial {...FIN.brass} transparent />
            </mesh>
            <mesh position={[0, -1.45, 0]}>
              <sphereGeometry args={[0.1, 18, 14]} />
              <meshStandardMaterial
                color="#ffe7c2"
                emissive="#ffc987"
                emissiveIntensity={1.8}
                transparent
              />
            </mesh>
          </group>
        ))}
        <pointLight ref={pendantLight} position={[0, -1.6, -2.85]} color="#ffc987" distance={8} intensity={0} />
        <pointLight ref={coveLight} position={[0, -0.4, -4.0]} color="#ffd9a6" distance={9} intensity={0} />
        <pointLight ref={panelLight} position={[-2.6, -2.2, -1]} color="#e8a45f" distance={6} intensity={0} />
      </Piece>

      {/* ===== Logo da marca em latão no painel ripado ===== */}
      <Piece progress={progress} window={[0.8, 0.92]} from={[-3.2, 5.5, -1]} to={[-2.95, 2.4, -1]}>
        <BrandMark />
      </Piece>
    </>
  );
}

/* ---------- Fallback elegante quando WebGL não está disponível ---------- */
function StaticFallback() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      role="img"
      aria-label="Ilustração de ambiente comercial em madeira de alto padrão"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-surface via-background to-background" />
      <div className="absolute bottom-0 left-1/2 h-1/2 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(156,114,72,0.25),transparent_65%)]" />
      <div className="absolute bottom-[18%] left-1/2 flex -translate-x-1/2 gap-2 opacity-70">
        {Array.from({ length: 11 }).map((_, i) => (
          <div
            key={i}
            className="w-2.5 rounded-sm bg-gradient-to-b from-bronze/70 to-wood"
            style={{ height: `${90 + (i % 4) * 26}px` }}
          />
        ))}
      </div>
    </div>
  );
}

interface Props {
  progress: Progress;
}

export default function ScrollFurnitureAssembly({ progress }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  // Pausa a renderização quando a cena sai da tela — evita que dois
  // canvas WebGL renderizem ao mesmo tempo (importante em GPUs modestas).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!supportsWebGL()) return <StaticFallback />;

  const mobile = isMobileViewport();

  return (
    // pointer-events-none: o canvas é decorativo — toques e gestos de
    // scroll atravessam direto para a página (essencial no mobile).
    <div ref={wrapRef} className="pointer-events-none absolute inset-0">
      <Canvas
        frameloop={inView ? "always" : "never"}
        shadows={!mobile}
        camera={{ fov: 38, near: 0.1, far: 60, position: [0, 3.4, 9.4] }}
        dpr={sceneDpr(mobile)}
        gl={{
          antialias: true,
          precision: "highp",
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false, // permite renderização por software
        }}
        onCreated={({ gl }) => {
          // Recupera o canvas se o navegador descartar o contexto WebGL
          // (comum em GPUs modestas e aparelhos com pouca memória)
          gl.domElement.addEventListener(
            "webglcontextlost",
            (e) => e.preventDefault(),
            false
          );
          gl.domElement.style.touchAction = "pan-y";
        }}
        aria-hidden="true"
      >
        <AssemblyScene progress={progress} />
      </Canvas>
    </div>
  );
}
