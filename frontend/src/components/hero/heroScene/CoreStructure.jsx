import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * CoreStructure
 * Represents the institutional anchor of the campus operating system:
 * Layered geometric architecture, interlocking obsidian facets,
 * and warm ember/volt conduits with dual-axis orbital rotation.
 */
export default function CoreStructure() {
  const groupRef = useRef();
  const innerRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.6) * 0.08;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y += delta * 0.18;
      innerRef.current.rotation.x += delta * 0.08;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z -= delta * 0.14;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x += delta * 0.11;
      ring2Ref.current.rotation.y += delta * 0.06;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y -= delta * 0.09;
      ring3Ref.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Central multifaceted institutional nucleus */}
      <group ref={innerRef}>
        {/* Obsidian solid core */}
        <mesh>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial
            color="#14100D"
            emissive="#D86D3E"
            emissiveIntensity={0.25}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>

        {/* Ember wireframe lattice cage */}
        <mesh>
          <octahedronGeometry args={[0.92, 0]} />
          <meshBasicMaterial
            color="#E7A66D"
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Central radiant point */}
        <mesh>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial color="#F4EFE8" />
        </mesh>
      </group>

      {/* Layer 1: Inner Ember Keystone Ring (tilted) */}
      <group ref={ring1Ref} rotation={[0.4, 0.2, 0]}>
        <mesh>
          <torusGeometry args={[1.5, 0.024, 16, 64]} />
          <meshStandardMaterial
            color="#D86D3E"
            emissive="#D86D3E"
            emissiveIntensity={0.8}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      </group>

      {/* Layer 2: Middle Hexagonal Structural Band */}
      <group ref={ring2Ref} rotation={[-0.35, 0.6, 0.3]}>
        <mesh>
          <torusGeometry args={[2.0, 0.02, 16, 48]} />
          <meshStandardMaterial
            color="#241B15"
            emissive="#E7A66D"
            emissiveIntensity={0.4}
            roughness={0.25}
            metalness={0.9}
          />
        </mesh>
      </group>

      {/* Layer 3: Outer Precision Conduit Ring */}
      <group ref={ring3Ref} rotation={[0.6, -0.4, 0.5]}>
        <mesh>
          <torusGeometry args={[2.45, 0.016, 16, 64]} />
          <meshStandardMaterial
            color="#79B8A6"
            emissive="#79B8A6"
            emissiveIntensity={0.65}
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
      </group>

      {/* Subtle core point light that illuminates surrounding conduits */}
      <pointLight color="#D86D3E" intensity={2.4} distance={4.5} decay={2} />
    </group>
  );
}
