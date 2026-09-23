import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * CameraRig
 * Smooth cursor parallax and gentle idle drift.
 * Keeps camera focal point locked on institutional core.
 */
export default function CameraRig() {
  const targetPos = useRef(new THREE.Vector3(0, 1.4, 6.2));

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const { pointer, camera } = state;

    // Target coordinates blending subtle mouse parallax + organic breathing motion
    const targetX = pointer.x * 1.2 + Math.sin(t * 0.4) * 0.2;
    const targetY = 1.4 + pointer.y * 0.6 + Math.cos(t * 0.3) * 0.15;
    const targetZ = 6.2 + Math.sin(t * 0.2) * 0.1;

    // Exponential smoothing
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 2.5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.5, delta);

    camera.lookAt(0, 0, 0);
  });

  return null;
}
