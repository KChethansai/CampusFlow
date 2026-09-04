// CampusScene: purposeful 3D digital campus. Six towers = six domains.
// Lazy-loaded; never blocks first paint. Hover reveals context via callback.
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import { DOMAINS } from './domains';

export { DOMAINS };

function Tower({ domain, position, height, active, onHover }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = height / 2 + Math.sin(t * 0.8 + position[0]) * 0.06;
  });
  return (
    <group position={[position[0], 0, position[1]]}>
      {/* ponytail: simple emissive boxes, no PBR textures — cheap + crisp */}
      <mesh
        ref={ref}
        position={[0, height / 2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); onHover(domain); }}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={[0.9, height, 0.9]} />
        <meshStandardMaterial
          color={domain.color}
          emissive={domain.color}
          emissiveIntensity={active ? 0.85 : 0.35}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial color={domain.color} transparent opacity={active ? 0.28 : 0.12} />
      </mesh>
      {/* rooftop beacon */}
      <mesh position={[0, height + 0.18, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={domain.color} />
      </mesh>
    </group>
  );
}

function Rig({ autoRotate = true }) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (autoRotate && ref.current) ref.current.rotation.y += delta * 0.08;
  });
  return <group ref={ref} />;
}

export function CampusSceneInner({ onHover, autoRotate }) {
  const [active, setActive] = useState(null);
  const towers = useMemo(() => {
    const spots = [[-2.4, -0.8], [-0.8, 0.9], [0.8, -0.9], [2.4, 0.8], [-0.1, -2.2], [0.1, 2.2]];
    const heights = [1.7, 2.3, 1.4, 2.0, 1.2, 2.6];
    return DOMAINS.map((d, i) => ({ ...d, position: spots[i], height: heights[i] }));
  }, []);

  const hover = (d) => {
    setActive(d?.key ?? null);
    onHover?.(d);
  };

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 4]} intensity={1.1} />
      <pointLight position={[-4, 3, -3]} intensity={12} color="#3395ff" />
      <group>
        {towers.map((t) => (
          <Float key={t.key} speed={1.4} rotationIntensity={0.06} floatIntensity={0.5}>
            <Tower domain={t} position={t.position} height={t.height} active={active === t.key} onHover={hover} />
          </Float>
        ))}
      </group>
      <group rotation={[0, 0, 0]}>
        <Rig autoRotate={autoRotate} />
      </group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#0e1830" roughness={0.9} metalness={0} transparent opacity={0.92} />
      </mesh>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={12} blur={2.4} far={4} />
    </>
  );
}

export default function CampusScene({ onHover, autoRotate = true, className, style }) {
  return (
    <div className={className} style={style}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [5.2, 4.2, 6.4], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <CampusSceneInner onHover={onHover} autoRotate={autoRotate} />
      </Canvas>
    </div>
  );
}
