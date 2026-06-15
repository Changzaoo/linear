import { useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group, AnimationAction, AnimationMixer } from "three";
import { getAvatarModel, type AvatarInstance } from "./avatarModel";

type Role = "cliente" | "arquiteto";

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
  const [inst, setInst] = useState<AvatarInstance | null>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const currentAction = useRef<AnimationAction | null>(null);

  useEffect(() => {
    let alive = true;
    getAvatarModel(role)
      .then((a) => {
        if (!alive) return;
        setInst(a);
        mixerRef.current = a.mixer;
        if (a.idle) {
          a.idle.play();
          currentAction.current = a.idle;
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
      mixerRef.current?.stopAllAction();
    };
  }, [role]);

  useFrame((state, delta) => {
    const mixer = mixerRef.current;
    if (mixer && inst) {
      // animação esquelética real (modelo riggado) — alterna idle/andar
      mixer.update(delta);
      const want = moving ? inst.walk : inst.idle;
      if (want && currentAction.current !== want) {
        currentAction.current?.fadeOut(0.25);
        want.reset().fadeIn(0.25).play();
        currentAction.current = want;
      }
      return;
    }
    // sem esqueleto: animação procedural no corpo inteiro
    if (!rig.current) return;
    const t = state.clock.elapsedTime;
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
        {inst ? (
          <primitive object={inst.object} dispose={null} />
        ) : (
          <mesh position={[0, 0.85, 0]} castShadow>
            <capsuleGeometry args={[0.18, 0.95, 6, 12]} />
            <meshStandardMaterial color={role === "arquiteto" ? "#2b3d4f" : "#7c6a4f"} roughness={0.75} transparent opacity={0.55} />
          </mesh>
        )}
      </group>

      {label && name && (
        <Html position={[0, 1.95, 0]} center occlude={false} zIndexRange={[24, 12]} style={{ pointerEvents: "none" }}>
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
