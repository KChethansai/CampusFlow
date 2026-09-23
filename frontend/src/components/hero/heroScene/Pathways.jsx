import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 6 primary operational nodes across the campus system
const NODES = [
  { id: 'academics', label: 'Academics', pos: [-2.6, 0.7, 0.5], color: '#D86D3E' },
  { id: 'students', label: 'Student Flow', pos: [2.5, 0.9, -0.4], color: '#25D890' },
  { id: 'placements', label: 'Placements', pos: [1.8, -1.3, 1.1], color: '#E7A66D' },
  { id: 'faculty', label: 'Faculty', pos: [-1.9, -1.2, -0.9], color: '#79B8A6' },
  { id: 'governance', label: 'Governance', pos: [0.2, 2.3, -0.8], color: '#F5B08A' },
  { id: 'analytics', label: 'Intelligence', pos: [-0.3, -2.2, 0.7], color: '#79B8A6' }
];

function NodeMesh({ node, active, onHover }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    // Gentle hovering breath
    meshRef.current.position.y = node.pos[1] + Math.sin(t * 1.2 + node.pos[0]) * 0.05;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <group position={node.pos}>
      <mesh
        ref={meshRef}
        scale={active ? 1.3 : 1.0}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.id);
        }}
        onPointerOut={() => onHover(null)}
      >
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          color="#1A1410"
          emissive={node.color}
          emissiveIntensity={active ? 1.6 : 0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Orbiting halo ring */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[0.32, 0.35, 24]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={active ? 0.8 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function Pathways() {
  const [activeNode, setActiveNode] = useState(null);
  const pulsesRef = useRef([]);

  // Precompute rail line segments from each node to the origin (core)
  // and inter-node perimeter links
  const { railLinesGeometry, interLinesGeometry } = useMemo(() => {
    const railPoints = [];
    const interPoints = [];

    // Core spokes
    NODES.forEach((node) => {
      railPoints.push(new THREE.Vector3(0, 0, 0));
      railPoints.push(new THREE.Vector3(...node.pos));
    });

    // Perimeter web connecting consecutive nodes
    for (let i = 0; i < NODES.length; i++) {
      const current = NODES[i];
      const next = NODES[(i + 1) % NODES.length];
      interPoints.push(new THREE.Vector3(...current.pos));
      interPoints.push(new THREE.Vector3(...next.pos));
    }

    const g1 = new THREE.BufferGeometry().setFromPoints(railPoints);
    const g2 = new THREE.BufferGeometry().setFromPoints(interPoints);
    return { railLinesGeometry: g1, interLinesGeometry: g2 };
  }, []);

  // Update pulsing data packets along spokes
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    pulsesRef.current.forEach((mesh, index) => {
      if (!mesh) return;
      const node = NODES[index];
      // Parametric progress 0..1 moving from core outward
      const progress = ((t * 0.4 + index * 0.16) % 1);
      mesh.position.set(
        node.pos[0] * progress,
        node.pos[1] * progress,
        node.pos[2] * progress
      );
    });
  });

  return (
    <group>
      {/* Central spokes connecting institution core to each domain */}
      <lineSegments geometry={railLinesGeometry}>
        <lineBasicMaterial
          color="#D86D3E"
          transparent
          opacity={0.35}
          linewidth={1}
        />
      </lineSegments>

      {/* Inter-domain secondary communication rails */}
      <lineSegments geometry={interLinesGeometry}>
        <lineBasicMaterial
          color="#79B8A6"
          transparent
          opacity={0.18}
          linewidth={1}
        />
      </lineSegments>

      {/* 6 Peripheral Domain Nodes */}
      {NODES.map((node) => (
        <NodeMesh
          key={node.id}
          node={node}
          active={activeNode === node.id}
          onHover={setActiveNode}
        />
      ))}

      {/* Animated data pulses traversing the spokes */}
      {NODES.map((node, i) => (
        <mesh
          key={`pulse-${node.id}`}
          ref={(el) => (pulsesRef.current[i] = el)}
        >
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#E7A66D" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}
