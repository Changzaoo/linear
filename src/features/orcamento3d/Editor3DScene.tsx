import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, PointerLockControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import FurnitureMesh from "./FurnitureMesh";
import { fpInput } from "./fpInput";
import {
  actions,
  useOrc3d,
} from "./useOrcamento3DStore";
import { publishCursor, usePeers } from "./presence";
import { myPeerId } from "./collaboration";
import type { EnvironmentConfig, PlacedFurniture, ViewMode } from "./types";

const FLOOR_COLORS: Record<EnvironmentConfig["floorType"], string> = {
  porcelanato: "#c9c2b5",
  madeira: "#8a5a33",
  cimento: "#7f7f7b",
  claro: "#e3ddd2",
  escuro: "#241f1a",
};

/* ---------- snap ---------- */
function snapPosition(
  x: number,
  z: number,
  f: PlacedFurniture,
  env: EnvironmentConfig,
  others: PlacedFurniture[],
  snap: { enabled: boolean; wall: boolean; corner: boolean; grid: boolean; furniture: boolean }
): [number, number] {
  if (!snap.enabled) return [x, z];
  const halfW = env.width / 200;
  const halfD = env.depth / 200;
  const fw = f.width / 200;
  const fd = f.depth / 200;
  const TH = 0.25; // tolerância de encaixe (m)

  if (snap.wall) {
    if (Math.abs(x - (-halfW + fw)) < TH) x = -halfW + fw;
    if (Math.abs(x - (halfW - fw)) < TH) x = halfW - fw;
    if (Math.abs(z - (-halfD + fd)) < TH) z = -halfD + fd;
    if (Math.abs(z - (halfD - fd)) < TH) z = halfD - fd;
  }
  if (snap.furniture) {
    for (const o of others) {
      if (Math.abs(x - o.position[0]) < TH) x = o.position[0];
      if (Math.abs(z - o.position[2]) < TH) z = o.position[2];
    }
  }
  if (snap.grid) {
    x = Math.round(x / 0.1) * 0.1;
    z = Math.round(z / 0.1) * 0.1;
  }
  // mantém dentro do ambiente
  x = Math.max(-halfW + fw, Math.min(halfW - fw, x));
  z = Math.max(-halfD + fd, Math.min(halfD - fd, z));
  return [x, z];
}

/* ---------- escada simples (degraus) ---------- */
function Stairs({ w, d, fromY, toY }: { w: number; d: number; fromY: number; toY: number }) {
  const steps = Math.max(6, Math.round((toY - fromY) / 0.2));
  const rise = (toY - fromY) / steps;
  const run = 0.28;
  const stepW = Math.min(1.1, w * 0.22);
  // encostada na parede direita, subindo em direção ao fundo
  const x = w / 2 - stepW / 2 - 0.1;
  return (
    <group>
      {Array.from({ length: steps }).map((_, i) => (
        <mesh key={i} position={[x, fromY + rise * (i + 0.5), d / 2 - 0.2 - run * (i + 0.5)]} castShadow receiveShadow>
          <boxGeometry args={[stepW, rise, run]} />
          <meshStandardMaterial color="#5a4636" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- mezanino (laje parcial + guarda-corpo) ---------- */
function Mezzanine({ w, d, y }: { w: number; d: number; y: number }) {
  const slabD = d * 0.4;
  const zCenter = -d / 2 + slabD / 2;
  const front = zCenter + slabD / 2;
  return (
    <group>
      <mesh position={[0, y, zCenter]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.12, 0.12, slabD]} />
        <meshStandardMaterial color="#6b4a30" roughness={0.7} />
      </mesh>
      {/* guarda-corpo na borda frontal */}
      <mesh position={[0, y + 0.5, front]}>
        <boxGeometry args={[w - 0.2, 0.04, 0.04]} />
        <meshStandardMaterial color="#caa86a" roughness={0.4} metalness={0.6} />
      </mesh>
      {Array.from({ length: Math.max(3, Math.round(w / 0.8)) }).map((_, i, arr) => {
        const px = -w / 2 + 0.2 + ((w - 0.4) * i) / (arr.length - 1);
        return (
          <mesh key={i} position={[px, y + 0.27, front]}>
            <boxGeometry args={[0.025, 0.5, 0.025]} />
            <meshStandardMaterial color="#caa86a" roughness={0.4} metalness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------- ambiente (pisos, paredes, mezanino, escada) ---------- */
function Room({ env, onFloorMove, onFloorUp }: {
  env: EnvironmentConfig;
  onFloorMove: (e: ThreeEvent<PointerEvent>) => void;
  onFloorUp: () => void;
}) {
  const w = env.width / 100;
  const d = env.depth / 100;
  const h = env.height / 100;
  const floors = Math.max(1, env.floors);
  const totalH = h * floors;
  const wallMat = { color: env.wallColor, roughness: 0.95, metalness: 0 };

  return (
    <group>
      {/* piso térreo (recebe o arraste dos móveis) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerMove={onFloorMove}
        onPointerUp={onFloorUp}
      >
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={FLOOR_COLORS[env.floorType]} roughness={0.85} />
      </mesh>

      {/* lajes dos andares superiores */}
      {Array.from({ length: floors - 1 }).map((_, i) => (
        <mesh key={i} position={[0, h * (i + 1), 0]} receiveShadow castShadow>
          <boxGeometry args={[w, 0.12, d]} />
          <meshStandardMaterial color={FLOOR_COLORS[env.floorType]} roughness={0.85} />
        </mesh>
      ))}

      {/* paredes (altura total do prédio) */}
      <mesh position={[0, totalH / 2, -d / 2]} receiveShadow>
        <boxGeometry args={[w, totalH, 0.06]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      <mesh position={[-w / 2, totalH / 2, 0]} receiveShadow>
        <boxGeometry args={[0.06, totalH, d]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      <mesh position={[w / 2, totalH / 2, 0]} receiveShadow>
        <boxGeometry args={[0.06, totalH, d]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      {!env.hasStorefront && (
        <mesh position={[0, totalH / 2, d / 2]} receiveShadow>
          <boxGeometry args={[w, totalH, 0.06]} />
          <meshStandardMaterial {...wallMat} transparent opacity={0.25} />
        </mesh>
      )}

      {env.hasMezzanine && <Mezzanine w={w} d={d} y={h * 0.6} />}
      {env.hasStairs && <Stairs w={w} d={d} fromY={0} toY={env.hasMezzanine ? h * 0.6 : h} />}
    </group>
  );
}

/* ---------- cursores dos colaboradores remotos ---------- */
function PresenceCursors() {
  const peers = usePeers();
  return (
    <>
      {peers
        .filter((p) => p.id !== myPeerId && p.cursor)
        .map((p) => (
          <group key={p.id} position={[p.cursor!.x, 0.02, p.cursor!.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.16, 0.22, 28]} />
              <meshBasicMaterial color={p.role === "arquiteto" ? "#7fd1ff" : "#D8B978"} transparent opacity={0.85} />
            </mesh>
            <mesh position={[0, 0.34, 0]}>
              <coneGeometry args={[0.08, 0.22, 12]} />
              <meshBasicMaterial color={p.role === "arquiteto" ? "#7fd1ff" : "#D8B978"} />
            </mesh>
          </group>
        ))}
    </>
  );
}

/* ---------- câmera por modo ---------- */
function CameraRig({ mode, env, mobile }: { mode: ViewMode; env: EnvironmentConfig; mobile: boolean }) {
  const { camera } = useThree();
  const w = env.width / 100;
  const d = env.depth / 100;

  useEffect(() => {
    if (mode === "isometrico") {
      const r = Math.max(w, d);
      camera.position.set(r * 0.85, r * 0.95, r * 0.85);
      camera.lookAt(0, 0, 0);
    } else if (mode === "terceira") {
      const r = Math.max(w, d);
      camera.position.set(0, r * 0.5, r * 0.95);
      camera.lookAt(0, 0.8, 0);
    } else {
      camera.position.set(0, 1.6, d * 0.35);
      camera.lookAt(0, 1.6, -d / 2);
    }
  }, [mode, w, d, camera]);

  // movimento primeira pessoa
  useFrame((_, dt) => {
    if (mode !== "primeira") return;
    if (mobile && (fpInput.lookDX || fpInput.lookDY)) {
      const e = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
      e.y -= fpInput.lookDX * 0.005;
      e.x -= fpInput.lookDY * 0.005;
      e.x = Math.max(-1.2, Math.min(1.2, e.x));
      camera.quaternion.setFromEuler(e);
      fpInput.lookDX = 0;
      fpInput.lookDY = 0;
    }
    const speed = (fpInput.sprint ? 3.4 : 1.7) * dt;
    if (fpInput.forward || fpInput.strafe) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      camera.position.addScaledVector(dir, fpInput.forward * speed);
      camera.position.addScaledVector(right, fpInput.strafe * speed);
    }
    camera.position.y = 1.6;
    const halfW = w / 2 - 0.3;
    const halfD = d / 2 - 0.3;
    camera.position.x = Math.max(-halfW, Math.min(halfW, camera.position.x));
    camera.position.z = Math.max(-halfD, Math.min(halfD, camera.position.z));
  });

  return null;
}

/* ---------- teclado primeira pessoa (desktop) ---------- */
function useFpKeyboard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") fpInput.forward = 1;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") fpInput.forward = -1;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") fpInput.strafe = -1;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") fpInput.strafe = 1;
      if (e.key === "Shift") fpInput.sprint = true;
    };
    const up = (e: KeyboardEvent) => {
      if (["w", "W", "ArrowUp", "s", "S", "ArrowDown"].includes(e.key)) fpInput.forward = 0;
      if (["a", "A", "ArrowLeft", "d", "D", "ArrowRight"].includes(e.key)) fpInput.strafe = 0;
      if (e.key === "Shift") fpInput.sprint = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      fpInput.forward = 0;
      fpInput.strafe = 0;
      fpInput.sprint = false;
    };
  }, [active]);
}

/* ---------- captura de tela p/ thumbnail ---------- */
function Capturer() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    const handler = () => {
      gl.render(scene, camera);
      try {
        const url = gl.domElement.toDataURL("image/jpeg", 0.5);
        actions.setThumbnail(url);
        window.dispatchEvent(new CustomEvent("orc3d:captured", { detail: url }));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("orc3d:capture", handler);
    return () => window.removeEventListener("orc3d:capture", handler);
  }, [gl, scene, camera]);
  return null;
}

/* ---------- conteúdo da cena ---------- */
function SceneContents({ mobile }: { mobile: boolean }) {
  const env = useOrc3d((s) => s.doc.environment);
  const furniture = useOrc3d((s) => s.doc.furniture);
  const selectedUid = useOrc3d((s) => s.selectedUid);
  const viewMode = useOrc3d((s) => s.viewMode);
  const snap = useOrc3d((s) => s.snap);
  const gridVisible = useOrc3d((s) => s.gridVisible);

  const orbitRef = useRef<any>(null);
  const [draggingUid, setDraggingUid] = useState<string | null>(null);
  const dragBaseY = useRef(0);

  useFpKeyboard(viewMode === "primeira" && !mobile);

  // solta o arraste mesmo se o ponteiro sair da cena
  useEffect(() => {
    const up = () => {
      if (draggingUid) {
        setDraggingUid(null);
        if (orbitRef.current) orbitRef.current.enabled = true;
      }
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [draggingUid]);

  const onFurnitureDown = (f: PlacedFurniture) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    actions.select(f.uid);
    if (viewMode === "primeira" || f.locked) return;
    dragBaseY.current = f.position[1];
    actions.beginDrag();
    setDraggingUid(f.uid);
    if (orbitRef.current) orbitRef.current.enabled = false;
  };

  const onFloorMove = (e: ThreeEvent<PointerEvent>) => {
    publishCursor(e.point.x, e.point.z); // presença em tempo real
    if (!draggingUid) return;
    const f = furniture.find((x) => x.uid === draggingUid);
    if (!f) return;
    const [sx, sz] = snapPosition(
      e.point.x,
      e.point.z,
      f,
      env,
      furniture.filter((o) => o.uid !== draggingUid),
      snap
    );
    actions.moveTo(draggingUid, [sx, dragBaseY.current, sz]);
  };

  const onFloorUp = () => {
    if (!draggingUid) return;
    setDraggingUid(null);
    if (orbitRef.current) orbitRef.current.enabled = true;
  };

  return (
    <>
      <color attach="background" args={["#0c0a08"]} />
      <fog attach="fog" args={["#0c0a08", Math.max(env.width, env.depth) / 100, (Math.max(env.width, env.depth) / 100) * 4.5]} />
      <ambientLight intensity={0.6} color="#f4e8d4" />
      <hemisphereLight args={["#cdbfa6", "#1a1510", 0.5]} />
      <directionalLight
        position={[6, 9, 4]}
        intensity={1.2}
        color="#ffe9c8"
        castShadow={!mobile}
        shadow-mapSize-width={mobile ? 512 : 1536}
        shadow-mapSize-height={mobile ? 512 : 1536}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />
      <CameraRig mode={viewMode} env={env} mobile={mobile} />
      <Capturer />

      <Room env={env} onFloorMove={onFloorMove} onFloorUp={onFloorUp} />
      <PresenceCursors />

      {gridVisible && (
        <Grid
          args={[env.width / 100, env.depth / 100]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#3a2f22"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#5a4032"
          fadeDistance={Math.max(env.width, env.depth) / 50}
          position={[0, 0.005, 0]}
          infiniteGrid={false}
        />
      )}

      {furniture.map((f) => (
        <FurnitureMesh
          key={f.uid}
          f={f}
          selected={f.uid === selectedUid}
          onPointerDown={onFurnitureDown(f)}
        />
      ))}

      {/* controles por modo */}
      {(viewMode === "isometrico" || viewMode === "terceira") && (
        <OrbitControls
          ref={orbitRef}
          makeDefault
          enableDamping
          dampingFactor={0.1}
          minDistance={1.5}
          maxDistance={Math.max(env.width, env.depth) / 40}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0.4, 0]}
        />
      )}
      {viewMode === "primeira" && !mobile && <PointerLockControls makeDefault />}
    </>
  );
}

export default function Editor3DScene({ mobile }: { mobile: boolean }) {
  return (
    <Canvas
      shadows={!mobile}
      dpr={mobile ? [1, 1.5] : [1, 2]}
      camera={{ fov: mobile ? 60 : 50, near: 0.05, far: 200, position: [8, 9, 8] }}
      gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
      onPointerMissed={() => actions.select(null)}
    >
      <SceneContents mobile={mobile} />
    </Canvas>
  );
}
