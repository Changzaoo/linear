import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import * as THREE from "three";
import { supportsWebGL, isMobileViewport } from "../lib/webgl";
import { woodTexture, stoneTexture, contactShadowTexture } from "../lib/textures";
import { sceneDpr, tuneRendererQuality, tuneTextureSampling } from "../lib/renderQuality";
import { siteData } from "../data/siteData";

/* ============================================================
   ExplodedCounter3D
   Um balcão comercial completo que, com o scroll, explode em
   um DIAGRAMA DE MONTAGEM: cada peça desliza ao longo do seu
   eixo real de encaixe (gavetas saem pelas corrediças, puxador
   sai no eixo dos parafusos, tampo sobe, base desce) e depois
   tudo volta a se encaixar exatamente onde estava.
   ============================================================ */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Fator de explosão: 0 → separa até 1 no meio do scroll → volta a 0. */
function explodeFactor(p: number) {
  return smooth(0.12, 0.42, p) * (1 - smooth(0.55, 0.88, p));
}

/** Calibra a exposição e a intensidade do ambiente da cena. */
function ExposureTuning() {
  const { scene, gl } = useThree();
  useEffect(() => {
    scene.environmentIntensity = 0.45;
    gl.toneMappingExposure = 1.12;
    tuneRendererQuality(gl, false);
    tuneTextureSampling(scene, gl);
  }, [scene, gl]);
  return null;
}

interface LayerProps {
  progress: MotionValue<number>;
  /** Eixo de encaixe da peça: direção e distância máxima de separação. */
  dir: [number, number, number];
  children: React.ReactNode;
}

function Layer({ progress, dir, children }: LayerProps) {
  const ref = useRef<THREE.Group>(null);
  const dirV = useMemo(() => new THREE.Vector3(...dir), [dir]);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const f = explodeFactor(progress.get());
    g.position.copy(dirV).multiplyScalar(f);
  });

  return <group ref={ref}>{children}</group>;
}

/** Parafuso (eixo Z): atravessa a frente e morde o montante interno. */
function Screw({ position }: { position: [number, number, number] }) {
  const shaftLength = 0.34;
  const headOffset = shaftLength / 2 + 0.009;

  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.012, 0.008, shaftLength, 8]} />
        <meshStandardMaterial color="#9a9a9a" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, headOffset, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.018, 10]} />
        <meshStandardMaterial color="#8a8a8a" roughness={0.35} metalness={0.9} />
      </mesh>
    </group>
  );
}

/** Cavilha de madeira (eixo X) — junta prateleira ↔ lateral. */
function Dowel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.014, 0.014, 0.1, 8]} />
      <meshStandardMaterial color="#a8772f" roughness={0.7} />
    </mesh>
  );
}

function CounterScene({ progress }: { progress: MotionValue<number> }) {
  const root = useRef<THREE.Group>(null);
  const ghost = useRef<THREE.LineSegments>(null);
  const mobile = useMemo(() => isMobileViewport(), []);
  const T = useMemo(
    () => ({
      freijoSlat: woodTexture("#7a4e2c", "#5a3a20", "#8f6038", [0.25, 1]),
      nogueira: woodTexture("#46301c", "#2f1f10", "#5c4024"),
      freijo: woodTexture("#7a4e2c", "#5a3a20", "#8f6038"),
      stone: stoneTexture(),
      shadow: contactShadowTexture(),
    }),
    []
  );
  // Contorno técnico (blueprint) que aparece durante a explosão
  const ghostGeom = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(3.46, 1.46, 1.34)),
    []
  );
  const fluteCount = mobile ? 10 : 18;

  useFrame((_, delta) => {
    if (root.current) root.current.rotation.y += delta * 0.18;
    if (ghost.current) {
      const f = explodeFactor(progress.get());
      (ghost.current.material as THREE.LineBasicMaterial).opacity = f * 0.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} color="#f2e6d0" />
      <directionalLight position={[5, 7, 4]} intensity={1.5} color="#ffd9a6" />
      <directionalLight position={[-5, 3, -4]} intensity={0.25} color="#7e7060" />

      {/* Reflexos de ambiente para metais, pedra e vidro */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2.2} color="#ffdcae" position={[0, 4, -4]} scale={[7, 3, 1]} />
        <Lightformer intensity={0.9} color="#b0a290" position={[-5, 2, 2]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} />
        <Lightformer intensity={0.7} color="#6e7a86" position={[5, 3, 4]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
      </Environment>
      <ExposureTuning />

      {/* Sombra de contato fixa sob o balcão (aterra o objeto) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
        <planeGeometry args={[5.2, 3.2]} />
        <meshBasicMaterial map={T.shadow} transparent opacity={0.6} depthWrite={false} />
      </mesh>

      <group ref={root} position={[0, -0.2, 0]} rotation={[0.12, 0.5, 0]}>
        {/* Contorno blueprint — visível apenas durante a explosão */}
        <lineSegments ref={ghost} geometry={ghostGeom}>
          <lineBasicMaterial color="#D8B978" transparent opacity={0} />
        </lineSegments>

        {/* Tampo em pedra com bordas em cascata — desce sobre o corpo */}
        <Layer progress={progress} dir={[0, 1.5, 0]}>
          <mesh position={[0, 0.595, 0]}>
            <boxGeometry args={[3.46, 0.09, 1.3]} />
            <meshStandardMaterial map={T.stone} roughness={0.3} metalness={0.05} />
          </mesh>
          <mesh position={[-1.695, 0, 0]}>
            <boxGeometry args={[0.07, 1.1, 1.3]} />
            <meshStandardMaterial map={T.stone} roughness={0.3} />
          </mesh>
          <mesh position={[1.695, 0, 0]}>
            <boxGeometry args={[0.07, 1.1, 1.3]} />
            <meshStandardMaterial map={T.stone} roughness={0.3} />
          </mesh>
        </Layer>

        {/* Corpo em MDF laminado: frente frisada + laterais — avança no eixo Z */}
        <Layer progress={progress} dir={[0, 0, 1.6]}>
          <mesh position={[0, 0, 0.5]}>
            <boxGeometry args={[3.16, 1.1, 0.08]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.52} />
          </mesh>
          {/* Frisos verticais em freijó, sob a aba do tampo */}
          {Array.from({ length: fluteCount }).map((_, i) => (
            <mesh key={i} position={[-1.45 + i * (2.9 / (fluteCount - 1)), 0, 0.5625]}>
              <boxGeometry args={[0.11, 1.04, 0.045]} />
              <meshStandardMaterial map={T.freijoSlat} roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[-1.62, 0, 0]}>
            <boxGeometry args={[0.08, 1.1, 1.05]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.52} />
          </mesh>
          <mesh position={[1.62, 0, 0]}>
            <boxGeometry args={[0.08, 1.1, 1.05]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.52} />
          </mesh>
        </Layer>

        {/* Parafusos que fixam a frente na estrutura — saem no eixo Z,
            alinhados com seus furos (entre a estrutura e a frente) */}
        <Layer progress={progress} dir={[0, 0, 0.9]}>
          <Screw position={[-1.5, 0.3, 0.4]} />
          <Screw position={[-1.5, -0.3, 0.4]} />
          <Screw position={[1.5, 0.3, 0.4]} />
          <Screw position={[1.5, -0.3, 0.4]} />
        </Layer>

        {/* Estrutura interna com travessas — recua para o fundo */}
        <Layer progress={progress} dir={[0, 0, -1.5]}>
          {[-1.5, 0, 1.5].map((x, i) => (
            <mesh key={i} position={[x, 0, 0.25]}>
              <boxGeometry args={[0.07, 1.1, 0.07]} />
              <meshStandardMaterial color="#1d1813" roughness={0.85} />
            </mesh>
          ))}
          <mesh position={[0, 0.515, 0.25]}>
            <boxGeometry args={[3.07, 0.07, 0.07]} />
            <meshStandardMaterial color="#1d1813" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.515, 0.25]}>
            <boxGeometry args={[3.07, 0.07, 0.07]} />
            <meshStandardMaterial color="#1d1813" roughness={0.85} />
          </mesh>
          {/* Travessas diagonais de contraventamento, atrás da frente */}
          {[-0.75, 0.75].map((x, i) => (
            <mesh key={`d-${i}`} position={[x, 0, 0.25]} rotation={[0, 0, i === 0 ? -0.97 : 0.97]}>
              <boxGeometry args={[0.05, 1.84, 0.07]} />
              <meshStandardMaterial color="#2a2118" roughness={0.85} />
            </mesh>
          ))}
          {/* Quadro de acabamento do fundo (lado do atendente): emoldura
              os vãos das gavetas no mesmo plano das frentes — nada de
              estrutura crua aparente. As gavetas deslizam por estes vãos. */}
          <mesh position={[0, -0.47, -0.52]}>
            <boxGeometry args={[3.16, 0.16, 0.04]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.52} />
          </mesh>
          <mesh position={[0, -0.015, -0.52]}>
            <boxGeometry args={[3.16, 0.07, 0.04]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.52} />
          </mesh>
          <mesh position={[0, -0.22, -0.52]}>
            <boxGeometry args={[0.4, 0.34, 0.04]} />
            <meshStandardMaterial map={T.nogueira} roughness={0.52} />
          </mesh>
          {[-1.19, 1.19].map((x, i) => (
            <mesh key={`f-${i}`} position={[x, -0.22, -0.52]}>
              <boxGeometry args={[0.78, 0.34, 0.04]} />
              <meshStandardMaterial map={T.nogueira} roughness={0.52} />
            </mesh>
          ))}
        </Layer>

        {/* Prateleira interna com divisórias — desce levemente para trás */}
        <Layer progress={progress} dir={[0, -0.6, -1.0]}>
          <mesh position={[0, 0.08, -0.14]}>
            <boxGeometry args={[3.16, 0.045, 0.62]} />
            <meshStandardMaterial map={T.freijo} roughness={0.5} />
          </mesh>
          {[-0.75, 0.75].map((x, i) => (
            <mesh key={i} position={[x, 0.28, -0.14]}>
              <boxGeometry args={[0.04, 0.36, 0.6]} />
              <meshStandardMaterial map={T.nogueira} roughness={0.55} />
            </mesh>
          ))}
        </Layer>

        {/* Cavilhas da prateleira — saem das laterais no próprio eixo X */}
        <Layer progress={progress} dir={[-0.7, 0, 0]}>
          <Dowel position={[-1.6, 0.08, -0.32]} />
          <Dowel position={[-1.6, 0.08, 0.04]} />
        </Layer>
        <Layer progress={progress} dir={[0.7, 0, 0]}>
          <Dowel position={[1.6, 0.08, -0.32]} />
          <Dowel position={[1.6, 0.08, 0.04]} />
        </Layer>

        {/* Corrediças telescópicas fixas na estrutura — recuam um pouco,
            deixando as gavetas saírem delas */}
        <Layer progress={progress} dir={[0, 0, -1.0]}>
          {[-0.795, -0.205, 0.205, 0.795].map((x, i) => (
            <mesh key={i} position={[x, -0.16, -0.2]}>
              <boxGeometry args={[0.025, 0.05, 0.56]} />
              <meshStandardMaterial color="#8a8a8a" roughness={0.35} metalness={0.9} />
            </mesh>
          ))}
        </Layer>

        {/* Gavetas completas (lado do atendente) — deslizam para fora
            no eixo das corrediças, como gavetas de verdade */}
        <Layer progress={progress} dir={[0, 0, -1.7]}>
          {[-0.5, 0.5].map((x, i) => (
            <group key={i} position={[x, -0.22, 0]}>
              {/* Frente da gaveta */}
              <mesh position={[0, 0, -0.565]}>
                <boxGeometry args={[0.56, 0.3, 0.04]} />
                <meshStandardMaterial map={T.nogueira} roughness={0.5} />
              </mesh>
              {/* Fundo */}
              <mesh position={[0, -0.14, -0.2275]}>
                <boxGeometry args={[0.52, 0.025, 0.635]} />
                <meshStandardMaterial map={T.freijo} roughness={0.55} />
              </mesh>
              {/* Laterais */}
              {[-0.2475, 0.2475].map((sx, j) => (
                <mesh key={j} position={[sx, -0.02, -0.2275]}>
                  <boxGeometry args={[0.025, 0.26, 0.635]} />
                  <meshStandardMaterial map={T.freijo} roughness={0.55} />
                </mesh>
              ))}
              {/* Traseira */}
              <mesh position={[0, -0.02, 0.08]}>
                <boxGeometry args={[0.52, 0.26, 0.025]} />
                <meshStandardMaterial map={T.freijo} roughness={0.55} />
              </mesh>
            </group>
          ))}
        </Layer>

        {/* Puxadores em latão — desencaixam da frente das gavetas
            no eixo dos parafusos (continuam alinhados com elas) */}
        <Layer progress={progress} dir={[0, 0, -2.4]}>
          {[-0.5, 0.5].map((x, i) => (
            <group key={i} position={[x, -0.2, 0]}>
              <mesh position={[0, 0, -0.63]}>
                <boxGeometry args={[0.34, 0.035, 0.035]} />
                <meshStandardMaterial color="#d8b070" roughness={0.25} metalness={0.85} />
              </mesh>
              {[-0.12, 0.12].map((px, j) => (
                <mesh key={j} position={[px, 0, -0.603]}>
                  <boxGeometry args={[0.018, 0.018, 0.05]} />
                  <meshStandardMaterial color="#b8945a" roughness={0.3} metalness={0.85} />
                </mesh>
              ))}
            </group>
          ))}
        </Layer>

        {/* Fita de LED sob a aba do tampo — sobe junto, um pouco menos,
            revelando onde fica embutida */}
        <Layer progress={progress} dir={[0, 1.1, 0.6]}>
          <mesh position={[0, 0.535, 0.615]}>
            <boxGeometry args={[3.1, 0.03, 0.05]} />
            <meshStandardMaterial color="#ffd9a0" emissive="#ffbe6e" emissiveIntensity={2.4} />
          </mesh>
          <pointLight position={[0, 0.45, 0.9]} color="#ffc987" intensity={1.6} distance={6} />
        </Layer>

        {/* Base / rodapé — desce */}
        <Layer progress={progress} dir={[0, -1.2, 0]}>
          <mesh position={[0, -0.62, 0]}>
            <boxGeometry args={[3.3, 0.14, 1.05]} />
            <meshStandardMaterial color="#141009" roughness={0.9} />
          </mesh>
        </Layer>
      </group>
    </>
  );
}

function StaticFallback() {
  return (
    <div className="flex h-full items-center justify-center" role="img" aria-label="Camadas de um balcão comercial">
      <div className="flex flex-col items-center gap-3">
        <div className="h-3 w-56 rounded bg-bronze/80" />
        <div className="h-20 w-52 rounded bg-wood/80" />
        <div className="h-3 w-56 rounded bg-surfaceSoft" />
      </div>
    </div>
  );
}

export default function ExplodedCounter3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const mobile = isMobileViewport();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Renderiza o canvas apenas quando a seção está visível — evita dois
  // contextos WebGL desenhando ao mesmo tempo em GPUs modestas.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const textOpacity = useTransform(scrollYProgress, [0.2, 0.35, 0.6, 0.75], [0, 1, 1, 0]);
  const { exploded } = siteData;

  return (
    <section ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Canvas 3D */}
        <div className="absolute inset-0">
          {supportsWebGL() ? (
            <Canvas
              frameloop={inView ? "always" : "never"}
              camera={{ fov: 35, position: [0, 0.6, 6.4] }}
              dpr={sceneDpr(mobile)}
              gl={{ antialias: true, precision: "highp", powerPreference: "high-performance" }}
              aria-hidden="true"
            >
              <CounterScene progress={scrollYProgress} />
            </Canvas>
          ) : (
            <StaticFallback />
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(8,7,6,0.8)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

        {/* Texto + camadas, visíveis durante a explosão */}
        <motion.div
          style={{ opacity: textOpacity }}
          className="container-site pointer-events-none relative z-10 grid items-center gap-10 md:grid-cols-2"
        >
          <div>
            <p className="eyebrow mb-4">{exploded.eyebrow}</p>
            <p className="max-w-md font-display text-2xl leading-snug md:text-4xl">
              {exploded.text}
            </p>
          </div>
          <ul className="hidden justify-self-end md:block" aria-label="Camadas do balcão">
            {exploded.layers.map((layer, i) => (
              <li
                key={layer}
                className="mb-3 flex items-center gap-3 text-sm text-muted"
                style={{ marginLeft: `${i * 10}px` }}
              >
                <span className="h-px w-10 bg-champagne/50" />
                {layer}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
