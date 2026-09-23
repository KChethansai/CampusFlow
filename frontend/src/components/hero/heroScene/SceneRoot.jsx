import CoreStructure from './CoreStructure';
import Pathways from './Pathways';
import Particles from './Particles';
import CameraRig from './CameraRig';

/**
 * SceneRoot
 * Composes the connected campus universe:
 * Institutional core, operational pathways, ambient data particles,
 * and cinematic ember/teal lighting.
 */
export default function SceneRoot() {
  return (
    <>
      {/* Deep Obsidian base ambient lighting */}
      <ambientLight color="#181310" intensity={1.5} />

      {/* Key warm ember directional light */}
      <directionalLight
        position={[4, 6, 5]}
        color="#E7A66D"
        intensity={2.4}
      />

      {/* Rim cool teal directional light for depth separation */}
      <directionalLight
        position={[-5, -2, -3]}
        color="#79B8A6"
        intensity={1.2}
      />

      {/* Top fill light for upper orbital structures */}
      <directionalLight
        position={[0, 5, 0]}
        color="#D86D3E"
        intensity={0.8}
      />

      {/* The 3D System Entities */}
      <CoreStructure />
      <Pathways />
      <Particles />
      <CameraRig />
    </>
  );
}
