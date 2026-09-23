import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 5 hub connection endpoints matching ArchitecturalPlanes
const HUBS = [
  { id: 'academics', pos: [-2.6, 0.4, 0.8], color: '#D86D3E' },
  { id: 'placement', pos: [2.5, -0.6, 1.1], color: '#E7A66D' },
  { id: 'governance', pos: [0.3, 1.8, -1.2], color: '#79B8A6' },
  { id: 'student_flow', pos: [2.4, 1.1, -0.6], color: '#25D890' },
  { id: 'intelligence', pos: [-2.0, -1.2, -0.7], color: '#79B8A6' }
];

export default function Pathways() {
  const pulsesRef = useRef([]);

  // Generate smooth 3D CatmullRom spline curves between the central core (0,0,0) and each hub
  const { curves, splineGeometries } = useMemo(() => {
    const list = HUBS.map((hub) => {
      // Create an arched intermediate midpoint for architectural grace
      const mid = new THREE.Vector3(
        hub.pos[0] * 0.5,
        hub.pos[1] * 0.5 + 0.35,
        hub.pos[2] * 0.5
      );
      const start = new THREE.Vector3(0, 0, 0);
      const end = new THREE.Vector3(...hub.pos);

      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const points = curve.getPoints(32);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      return { curve, geometry, color: hub.color };
    });

    return {
      curves: list.map((l) => l.curve),
      splineGeometries: list
    };
  }, []);

  // Update traveling data pulses along the 3D curves
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    pulsesRef.current.forEach((mesh, index) => {
      if (!mesh || !curves[index]) return;
      const curve = curves[index];
      // Parametric progression 0..1
      const progress = (t * 0.35 + index * 0.2) % 1;
      const pt = curve.getPoint(progress);
      mesh.position.copy(pt);
    });
  });

  return (
    <group>
      {/* 3D Curved Conduits linking Core to Hubs */}
      {splineGeometries.map((sg, i) => (
        <line key={`line-${i}`} geometry={sg.geometry}>
          <lineBasicMaterial
            color={sg.color}
            transparent
            opacity={0.45}
            linewidth={1.5}
          />
        </line>
      ))}

      {/* Traveling illuminated data pulses along the curves */}
      {HUBS.map((hub, i) => (
        <mesh
          key={`pulse-${hub.id}`}
          ref={(el) => (pulsesRef.current[i] = el)}
        >
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial
            color="#FFF"
            emissive={hub.color}
            emissiveIntensity={2.0}
          />
        </mesh>
      ))}
    </group>
  );
}
