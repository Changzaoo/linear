import { useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group, Object3D } from "three";
import { getAvatarModel } from "./avatarModel";

type Role = "cliente" | "arquiteto";

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
  const rig = useRef<Group>(null);
  const [model, setModel] = useState<Object3D | null>(null);

  useEffect(() => {
    let alive = true;
    getAvatarModel(role)
      .then((o) => alive && setModel(o))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [role]);

  // Animação procedural (modelos OBJ não têm esqueleto): passada com balanço
  // vertical, leve inclinação à frente e gingado; respiração quando parado.
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!rig.current) return;
    if (moving) {
      const ph = t * 7.5;
      rig.current.position.y = Math.abs(Math.sin(ph)) * 0.06;
      rig.current.rotation.z = Math.sin(ph) * 0.04;
      rig.current.rotation.x = -0.07 + Math.sin(ph * 0.5) * 0.02;
    } else {
      rig.current.position.y = Math.sin(t * 1.6) * 0.012;
      rig.current.rotation.z = 0;
      rig.current.rotation.x = 0;
    }
  });

  return (
    <group>
      {/* sombra de contato */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.34, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.26} />
      </mesh>

      <group ref={rig}>
        {model ? (
          <primitive object={model} dispose={null} />
        ) : (
          // placeholder discreto enquanto o modelo carrega
          <mesh position={[0, 0.85, 0]} castShadow>
            <capsuleGeometry args={[0.18, 0.95, 6, 12]} />
            <meshStandardMaterial color={role === "arquiteto" ? "#2b3d4f" : "#7c6a4f"} roughness={0.75} transparent opacity={0.55} />
          </mesh>
        )}
      </group>

      {label && name && (
        <Html
          position={[0, 1.95, 0]}
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
