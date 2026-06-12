import * as THREE from "three";

export function sceneDpr(mobile: boolean): [number, number] {
  return mobile ? [1.5, 1.75] : [1.75, 2];
}

export function tuneRendererQuality(gl: THREE.WebGLRenderer, enableShadows: boolean) {
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.shadowMap.enabled = enableShadows;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
}

export function tuneTextureSampling(scene: THREE.Scene, gl: THREE.WebGLRenderer) {
  const anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), 8);

  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      const mat = material as THREE.Material & {
        map?: THREE.Texture | null;
        alphaMap?: THREE.Texture | null;
        emissiveMap?: THREE.Texture | null;
        roughnessMap?: THREE.Texture | null;
        metalnessMap?: THREE.Texture | null;
        normalMap?: THREE.Texture | null;
      };

      [mat.map, mat.alphaMap, mat.emissiveMap, mat.roughnessMap, mat.metalnessMap, mat.normalMap]
        .filter((texture): texture is THREE.Texture => Boolean(texture))
        .forEach((texture) => {
          texture.anisotropy = Math.max(texture.anisotropy, anisotropy);
          texture.magFilter = THREE.LinearFilter;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.generateMipmaps = true;
          texture.needsUpdate = true;
        });
    });
  });
}
