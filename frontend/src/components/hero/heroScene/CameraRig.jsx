import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * CameraRig
 * Smooth cursor parallax and dynamic scroll-driven camera arc.
 * As user scrolls, camera gently transitions from an establishing view
 * to an elevated topological perspective.
 */
export default function CameraRig() {
  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      // Normalize scroll over the first 600px
      scrollOffsetRef.current = Math.min(Math.max(scrollY / 600, 0), 1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const { pointer, camera } = state;
    const scrollFactor = scrollOffsetRef.current;

    // Target coordinates blending cursor parallax + scroll elevation
    const targetX = pointer.x * 1.4 + Math.sin(t * 0.35) * 0.15;
    const targetY = 1.3 + pointer.y * 0.5 + scrollFactor * 0.8;
    const targetZ = 6.2 - scrollFactor * 0.9 + Math.sin(t * 0.2) * 0.1;

    // Exponential smoothing (damp)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2.8, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 2.8, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.8, delta);

    // Look at center slightly elevated
    camera.lookAt(0, scrollFactor * 0.2, 0);
  });

  return null;
}
