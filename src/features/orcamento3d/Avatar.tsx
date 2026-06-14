import { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

type Role = "cliente" | "arquiteto";

/* Paleta por papel — o arquiteto veste azul-petróleo (equipe),
   o cliente veste tons quentes champagne/madeira. */
const PALETTE: Record<Role, { jacket: string; pants: string; accent: string; shoe: string }> = {
  arquiteto: { jacket: "#2b3d4f", pants: "#1c2a36", accent: "#9fb7d1", shoe: "#10171d" },
  cliente: { jacket: "#7c6a4f", pants: "#403425", accent: "#d8b978", shoe: "#221a12" },
};

const SKIN = "#c79a7d";
const HAIR = "#241c16";

/* Mostra só o primeiro nome (até 2 palavras) para a etiqueta não estourar. */
function shortName(name?: string) {
  if (!name) return "";
  return name.trim().split(/\s+/).slice(0, 2).join(" ");
}

export default function Avatar({
  role,
  name,
  moving = false,
  label = true,
}: {
  role: Role;
  name?: string;
  moving?: boolean;
  label?: boolean;
}) {
  const root = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const shinL = useRef<Group>(null);
  const shinR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const torso = useRef<Group>(null);

  const c = PALETTE[role];

  // Caminhada cíclica: pernas alternadas, braços em oposição, leve balanço do tronco.
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const stride = moving ? 0.9 : 0;
    const freq = moving ? 7.5 : 1.6;
    const phase = t * freq;
    const swing = Math.sin(phase) * stride;
    const counter = Math.sin(phase + Math.PI) * stride;

    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = counter;
    // joelho dobra mais quando a perna vai para trás
    if (shinL.current) shinL.current.rotation.x = Math.max(0, -swing) * 0.9;
    if (shinR.current) shinR.current.rotation.x = Math.max(0, -counter) * 0.9;
    if (armL.current) armL.current.rotation.x = counter * 0.7;
    if (armR.current) armR.current.rotation.x = swing * 0.7;

    // bob vertical (2x a frequência do passo) + respiração quando parado
    const bob = moving ? Math.abs(Math.sin(phase)) * 0.05 : Math.sin(t * 1.6) * 0.012;
    if (root.current) root.current.position.y = bob;
    if (torso.current) {
      torso.current.rotation.z = moving ? Math.sin(phase) * 0.04 : 0;
      torso.current.rotation.y = moving ? Math.sin(phase) * 0.05 : 0;
    }
  });

  return (
    <group>
      {/* sombra de contato */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.3, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.26} />
      </mesh>

      <group ref={root}>
        {/* perna esquerda — quadril em ~0.92m; coxa, joelho que dobra, canela e sapato */}
        <group ref={legL} position={[-0.085, 0.92, 0]}>
          <mesh position={[0, -0.21, 0]} castShadow>
            <capsuleGeometry args={[0.062, 0.34, 5, 10]} />
            <meshStandardMaterial color={c.pants} roughness={0.85} />
          </mesh>
          {/* joelho (pivô) */}
          <group ref={shinL} position={[0, -0.43, 0]}>
            <mesh position={[0, -0.21, 0]} castShadow>
              <capsuleGeometry args={[0.052, 0.32, 5, 10]} />
              <meshStandardMaterial color={c.pants} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.45, 0.05]} castShadow>
              <boxGeometry args={[0.11, 0.07, 0.23]} />
              <meshStandardMaterial color={c.shoe} roughness={0.5} metalness={0.1} />
            </mesh>
          </group>
        </group>
        {/* perna direita */}
        <group ref={legR} position={[0.085, 0.92, 0]}>
          <mesh position={[0, -0.21, 0]} castShadow>
            <capsuleGeometry args={[0.062, 0.34, 5, 10]} />
            <meshStandardMaterial color={c.pants} roughness={0.85} />
          </mesh>
          <group ref={shinR} position={[0, -0.43, 0]}>
            <mesh position={[0, -0.21, 0]} castShadow>
              <capsuleGeometry args={[0.052, 0.32, 5, 10]} />
              <meshStandardMaterial color={c.pants} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.45, 0.05]} castShadow>
              <boxGeometry args={[0.11, 0.07, 0.23]} />
              <meshStandardMaterial color={c.shoe} roughness={0.5} metalness={0.1} />
            </mesh>
          </group>
        </group>

        {/* tronco + cabeça */}
        <group ref={torso} position={[0, 0.92, 0]}>
          {/* quadril/cintura */}
          <mesh position={[0, 0.02, 0]} castShadow>
            <capsuleGeometry args={[0.15, 0.12, 6, 12]} />
            <meshStandardMaterial color={c.pants} roughness={0.82} />
          </mesh>
          {/* torso (jaqueta) — levemente afunilado */}
          <mesh position={[0, 0.32, 0]} castShadow>
            <capsuleGeometry args={[0.18, 0.4, 8, 16]} />
            <meshStandardMaterial color={c.jacket} roughness={0.7} />
          </mesh>
          {/* gola / decote em tom de pele */}
          <mesh position={[0, 0.56, 0.02]}>
            <cylinderGeometry args={[0.07, 0.09, 0.08, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} />
          </mesh>
          {/* faixa de acento (zíper/lapela) */}
          <mesh position={[0, 0.34, 0.165]}>
            <boxGeometry args={[0.02, 0.42, 0.02]} />
            <meshStandardMaterial color={c.accent} roughness={0.5} metalness={0.3} />
          </mesh>

          {/* ombros */}
          <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.07, 0.28, 4, 8]} />
            <meshStandardMaterial color={c.jacket} roughness={0.7} />
          </mesh>

          {/* braço esquerdo (ombro em ~0.5m) */}
          <group ref={armL} position={[-0.23, 0.5, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.045, 0.34, 4, 8]} />
              <meshStandardMaterial color={c.jacket} roughness={0.72} />
            </mesh>
            <mesh position={[0, -0.42, 0]} castShadow>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.6} />
            </mesh>
          </group>
          {/* braço direito */}
          <group ref={armR} position={[0.23, 0.5, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.045, 0.34, 4, 8]} />
              <meshStandardMaterial color={c.jacket} roughness={0.72} />
            </mesh>
            <mesh position={[0, -0.42, 0]} castShadow>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.6} />
            </mesh>
            {/* prancheta do arquiteto na mão direita */}
            {role === "arquiteto" && (
              <mesh position={[0.04, -0.42, 0.12]} rotation={[0.5, 0.2, 0]} castShadow>
                <boxGeometry args={[0.2, 0.28, 0.018]} />
                <meshStandardMaterial color="#ece8de" roughness={0.35} metalness={0.12} />
              </mesh>
            )}
          </group>

          {/* pescoço */}
          <mesh position={[0, 0.62, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.055, 0.08, 10]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} />
          </mesh>
          {/* cabeça */}
          <mesh position={[0, 0.73, 0]} castShadow>
            <sphereGeometry args={[0.115, 18, 18]} />
            <meshStandardMaterial color={SKIN} roughness={0.62} />
          </mesh>
          {/* cabelo */}
          <mesh position={[0, 0.77, -0.01]} castShadow>
            <sphereGeometry args={[0.122, 18, 18, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <meshStandardMaterial color={HAIR} roughness={0.9} />
          </mesh>
          {/* óculos do arquiteto */}
          {role === "arquiteto" && (
            <mesh position={[0, 0.74, 0.1]}>
              <boxGeometry args={[0.14, 0.03, 0.01]} />
              <meshStandardMaterial color="#0e1318" roughness={0.3} metalness={0.4} />
            </mesh>
          )}
        </group>
      </group>

      {label && name && (
        <Html
          position={[0, 1.78, 0]}
          center
          occlude={false}
          zIndexRange={[24, 12]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none shadow-sm ${
              role === "arquiteto"
                ? "border-sky-400/40 bg-sky-500/25 text-sky-100"
                : "border-champagne/40 bg-champagne/25 text-champagne"
            }`}
          >
            {role === "arquiteto" ? "Arquiteto" : "Cliente"}
            {name ? ` · ${shortName(name)}` : ""}
          </div>
        </Html>
      )}
    </group>
  );
}
