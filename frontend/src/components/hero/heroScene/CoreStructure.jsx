import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * CoreStructure
 * Crystalline monolithic institutional anchor of the campus operating system:
 * Multifaceted obsidian outer prism, warm radiant ember core crystal,
 * and dual-axis Keplerian orbital rings.
 */
export default function CoreStructure() {
  const groupRef = useRef();
  const innerRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.7) * 0.07;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y += delta * 0.22;
      innerRef.current.rotation.x += delta * 0.09;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z -= delta * 0.16;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x += delta * 0.12;
      ring2Ref.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Central Multifaceted Institutional Monolith */}
      <group ref={innerRef}>
        {/* Obsidian faceted crystalline geometry */}
        <mesh>
          <icosahedronGeometry args={[0.95, 0]} />
          <meshStandardMaterial
            color="#14100D"
            emissive="#D86D3E"
            emissiveIntensity={0.3}
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>

        {/* Outer glowing wireframe keystone cage */}
        <mesh>
          <icosahedronGeometry args={[0.98, 0]} />
          <meshBasicMaterial
            color="#E7A66D"
            wireframe
            transparent
            opacity={0.45}
          />
        </mesh>

        {/* Radiant interior point core */}
        <mesh>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshStandardMaterial
            color="#FFF"
            emissive="#D86D3E"
            emissiveIntensity={2.5}
          />
        </mesh>
      </group>

      {/* Layer 1: Inner Ember Keystone Ring (Tilted Dual Axis) */}
      <group ref={ring1Ref} rotation={[0.45, 0.25, 0]}>
        <mesh>
          <torusGeometry args={[1.55, 0.026, 16, 64]} />
          <meshStandardMaterial
            color="#D86D3E"
            emissive="#D86D3E"
            emissiveIntensity={0.85}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </group>

      {/* Layer 2: Outer Precision Conduit Ring with Teal/Volt Accent */}
      <group ref={ring2Ref} rotation={[-0.4, 0.65, 0.35]}>
        <mesh>
          <torusGeometry args={[2.05, 0.02, 16, 64]} />
          <meshStandardMaterial
            color="#79B8A6"
            emissive="#79B8A6"
            emissiveIntensity={0.7}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      </group>

      {/* Radiant Core Point Light */}
      <pointLight color="#D86D3E" intensity={3.0} distance={5.5} decay={2} />
    </group>
  );
}
