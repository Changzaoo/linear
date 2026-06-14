import { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

type Role = "cliente" | "arquiteto";

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
  const body = useRef<Group>(null);
  const legs = useRef<Group>(null);
  const outfit = role === "arquiteto" ? "#29394a" : "#75654f";
  const accent = role === "arquiteto" ? "#9fb7d1" : "#d8b978";

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (body.current) body.current.position.y = Math.sin(t * (moving ? 8 : 2)) * (moving ? 0.028 : 0.01);
    if (legs.current) legs.current.rotation.x = moving ? Math.sin(t * 8) * 0.4 : 0;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.28, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>

      <group ref={body}>
        <group ref={legs} position={[0, 0.42, 0]}>
          <mesh position={[-0.08, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.32, 4, 8]} />
            <meshStandardMaterial color="#211d19" roughness={0.8} />
          </mesh>
          <mesh position={[0.08, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.32, 4, 8]} />
            <meshStandardMaterial color="#211d19" roughness={0.8} />
          </mesh>
        </group>

        <mesh position={[0, 0.78, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.36, 6, 12]} />
          <meshStandardMaterial color={outfit} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.99, 0.02]} castShadow>
          <torusGeometry args={[0.1, 0.02, 8, 16]} />
          <meshStandardMaterial color={accent} roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh position={[-0.22, 0.8, 0]} rotation={[0, 0, 0.16]} castShadow>
          <capsuleGeometry args={[0.045, 0.3, 4, 8]} />
          <meshStandardMaterial color={outfit} roughness={0.72} />
        </mesh>
        <mesh position={[0.22, 0.8, 0]} rotation={[0, 0, -0.16]} castShadow>
          <capsuleGeometry args={[0.045, 0.3, 4, 8]} />
          <meshStandardMaterial color={outfit} roughness={0.72} />
        </mesh>
        <mesh position={[0, 1.18, 0]} castShadow>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#c7a48b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.25, -0.02]} castShadow>
          <sphereGeometry args={[0.135, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial color="#241c16" roughness={0.9} />
        </mesh>

        {role === "arquiteto" && (
          <mesh position={[0.27, 0.73, 0.15]} rotation={[0.45, 0.2, 0]} castShadow>
            <boxGeometry args={[0.2, 0.28, 0.02]} />
            <meshStandardMaterial color="#ece8de" roughness={0.35} metalness={0.12} />
          </mesh>
        )}
      </group>

      {label && name && (
        <Html position={[0, 1.55, 0]} center distanceFactor={12} occlude={false}>
          <div
            className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] ${
              role === "arquiteto"
                ? "border-sky-400/40 bg-sky-500/20 text-sky-200"
                : "border-champagne/40 bg-champagne/20 text-champagne"
            }`}
          >
            {role === "arquiteto" ? "Arquiteto" : "Cliente"} {name ? `- ${name}` : ""}
          </div>
        </Html>
      )}
    </group>
  );
}
