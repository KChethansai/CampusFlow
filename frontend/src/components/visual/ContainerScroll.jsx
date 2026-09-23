import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useReducedMotion } from '../../system/motion';

/**
 * ContainerScroll
 * 21st.dev Container Scroll Animation pattern.
 * Creates an immersive 3D perspective card reveal as the user scrolls down:
 * Tilts from rotateX(20deg) down to 0deg, scales smoothly from 0.94 to 1.0,
 * and lifts toward the viewer.
 */
export default function ContainerScroll({
  children,
  titleComponent,
  className = ''
}) {
  const containerRef = useRef(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  const rotate = useTransform(scrollYProgress, [0, 0.45], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [0.93, 1]);
  const translateY = useTransform(scrollYProgress, [0, 0.45], [40, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0.6, 1]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full py-12 md:py-20 flex flex-col items-center justify-center [perspective:1200px] ${className}`}
    >
      {titleComponent && (
        <div className="w-full max-w-5xl mb-8 sm:mb-12 text-center">
          {titleComponent}
        </div>
      )}

      <motion.div
        style={
          reduced
            ? undefined
            : {
                rotateX: rotate,
                scale,
                y: translateY,
                opacity
              }
        }
        className="w-full max-w-6xl mx-auto will-change-transform"
      >
        <div className="relative rounded-[32px] p-2 sm:p-3 bg-gradient-to-b from-white/10 via-white/[0.04] to-transparent dark:from-white/10 dark:via-white/[0.02] border border-black/10 dark:border-white/10 shadow-2xl shadow-black/40">
          <div className="rounded-[26px] overflow-hidden bg-[#100D0B]">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
