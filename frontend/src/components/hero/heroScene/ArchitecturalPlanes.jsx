import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 5 Elevated Campus Architectural Hub Platforms
const HUBS = [
  {
    id: 'academics',
    name: 'Academics Hub',
    pos: [-2.6, 0.4, 0.8],
    size: [1.2, 0.08, 0.9],
    color: '#D86D3E',
    glow: '#E7A66D'
  },
  {
    id: 'placement',
    name: 'Placement Cell',
    pos: [2.5, -0.6, 1.1],
    size: [1.3, 0.08, 0.9],
    color: '#E7A66D',
    glow: '#F5B08A'
  },
  {
    id: 'governance',
    name: 'Governance Tower',
    pos: [0.3, 1.8, -1.2],
    size: [1.4, 0.1, 1.0],
    color: '#79B8A6',
    glow: '#79B8A6'
  },
  {
    id: 'student_flow',
    name: 'Student Flow',
    pos: [2.4, 1.1, -0.6],
    size: [1.1, 0.08, 0.8],
    color: '#25D890',
    glow: '#25D890'
  },
  {
    id: 'intelligence',
    name: 'Intelligence Engine',
    pos: [-2.0, -1.2, -0.7],
    size: [1.2, 0.08, 0.85],
    color: '#79B8A6',
    glow: '#E7A66D'
  }
];

function HubPlatform({ hub, index }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Gentle floating breathing offset
    groupRef.current.position.y =
      hub.pos[1] + Math.sin(t * 0.8 + index * 1.2) * 0.06;
  });

  return (
    <group ref={groupRef} position={hub.pos}>
      {/* Primary obsidian architectural slab */}
      <mesh>
        <boxGeometry args={hub.size} />
        <meshStandardMaterial
          color="#16120F"
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      {/* Emissive perimeter wireframe/neon boundary */}
      <mesh>
        <boxGeometry args={[hub.size[0] + 0.02, hub.size[1] + 0.02, hub.size[2] + 0.02]} />
        <meshBasicMaterial
          color={hub.color}
          wireframe
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Vertical Signal Beacon on the hub */}
      <group position={[0, hub.size[1] / 2 + 0.18, 0]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.36, 8]} />
          <meshBasicMaterial color={hub.glow} />
        </mesh>
        {/* Radiant beacon crown */}
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial
            color="#FFF"
            emissive={hub.color}
            emissiveIntensity={1.8}
          />
        </mesh>
      </group>

      {/* Miniature architectural data fins */}
      <mesh position={[hub.size[0] * 0.3, hub.size[1] / 2 + 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, hub.size[2] * 0.6]} />
        <meshStandardMaterial
          color="#201814"
          emissive={hub.color}
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  );
}

export default function ArchitecturalPlanes() {
  return (
    <group>
      {HUBS.map((hub, i) => (
        <HubPlatform key={hub.id} hub={hub} index={i} />
      ))}
    </group>
  );
}
