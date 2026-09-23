import CoreStructure from './CoreStructure';
import ArchitecturalPlanes from './ArchitecturalPlanes';
import Pathways from './Pathways';
import Particles from './Particles';
import CameraRig from './CameraRig';

/**
 * SceneRoot
 * Composes the connected campus universe:
 * Institutional crystalline core, elevated architectural hub platforms,
 * 3D curved data spline conduits, ambient data particles,
 * and cinematic ember/teal lighting.
 */
export default function SceneRoot() {
  return (
    <>
      {/* Deep Obsidian base ambient lighting */}
      <ambientLight color="#181310" intensity={1.6} />

      {/* Key warm ember directional light */}
      <directionalLight
        position={[4, 6, 5]}
        color="#E7A66D"
        intensity={2.6}
      />

      {/* Rim cool teal directional light for topological depth separation */}
      <directionalLight
        position={[-5, -2, -3]}
        color="#79B8A6"
        intensity={1.4}
      />

      {/* Top fill light for upper orbital structures */}
      <directionalLight
        position={[0, 6, 0]}
        color="#D86D3E"
        intensity={1.0}
      />

      {/* 3D System Entities */}
      <CoreStructure />
      <ArchitecturalPlanes />
      <Pathways />
      <Particles />
      <CameraRig />
    </>
  );
}
