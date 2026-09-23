import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '../../system/motion';
import { GraduationCap, Users, Briefcase, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

const WORKFLOW_NODES = [
  {
    id: 'student',
    role: 'Student Flow',
    subtitle: 'Learner Command Center',
    icon: GraduationCap,
    color: '#D86D3E',
    angle: 215, // bottom-left
    distance: 140,
    status: 'Unified attendance & coursework',
    details: 'One identity across lecture attendance, assignment deadlines, placement drives, and study syllabi.'
  },
  {
    id: 'faculty',
    role: 'Faculty Portal',
    subtitle: 'Instruction & Records',
    icon: Users,
    color: '#79B8A6',
    angle: 325, // bottom-right
    distance: 140,
    status: 'Instant roster & grading queues',
    details: 'Daily attendance marking in under 30 seconds, single-click leave request approvals, and streamlined grading.'
  },
  {
    id: 'placement',
    role: 'Placement Cell',
    subtitle: 'Corporate Recruitment',
    icon: Briefcase,
    color: '#E7A66D',
    angle: 35, // top-right
    distance: 140,
    status: '6-stage eligibility pipeline',
    details: 'Direct job drive publishing, automated CGPA/backlog eligibility filtering, and offer rollouts.'
  },
  {
    id: 'admin',
    role: 'Administration',
    subtitle: 'Institutional Governance',
    icon: ShieldCheck,
    color: '#F5B08A',
    angle: 145, // top-left
    distance: 140,
    status: 'RBAC & AI intelligence reports',
    details: 'Multi-tenant isolation, bulk user CSV provisioning, syllabus ingestion, and AI student retention signals.'
  }
];

export default function RadialOrbitalTimeline() {
  const [selectedId, setSelectedId] = useState('student');
  const reduced = useReducedMotion();

  const selectedNode = WORKFLOW_NODES.find((n) => n.id === selectedId) || WORKFLOW_NODES[0];

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-[32px] border border-black/10 dark:border-white/10 bg-[#14100D]/90 backdrop-blur-2xl p-6 sm:p-10 overflow-hidden text-white shadow-2xl shadow-black/50">
      {/* Background ambient radial gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(600px 380px at 50% 50%, rgba(216,109,62,0.12), transparent 70%), radial-gradient(400px 300px at 85% 15%, rgba(121,184,166,0.08), transparent 60%)'
        }}
      />

      <div className="relative z-10 grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
        {/* Left: Interactive Radial Orbital Canvas */}
        <div className="relative w-full aspect-square max-w-[420px] mx-auto flex items-center justify-center">
          {/* Orbital Concentric SVG Rings */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="-200 -200 400 400">
            <circle cx="0" cy="0" r="140" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx="0" cy="0" r="90" fill="none" stroke="rgba(216,109,62,0.20)" strokeWidth="1.2" />

            {/* Connecting Spoke Rays from center to each node */}
            {WORKFLOW_NODES.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const x = Math.cos(rad) * node.distance;
              const y = Math.sin(rad) * node.distance;
              const isSelected = node.id === selectedId;

              return (
                <g key={`spoke-${node.id}`}>
                  <line
                    x1="0"
                    y1="0"
                    x2={x}
                    y2={y}
                    stroke={isSelected ? node.color : 'rgba(255,255,255,0.12)'}
                    strokeWidth={isSelected ? '2' : '1'}
                    strokeDasharray={isSelected ? 'none' : '3 3'}
                  />
                  {/* Active Pulse along selected spoke */}
                  {isSelected && !reduced && (
                    <circle cx={x * 0.55} cy={y * 0.55} r="3" fill={node.color} opacity="0.9">
                      <animate
                        attributeName="cx"
                        values={`0; ${x}`}
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="cy"
                        values={`0; ${y}`}
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Central System Core Nucleus */}
          <div className="relative z-20 w-24 h-24 rounded-full bg-[#1C1512] border-2 border-[#E7A66D] shadow-xl shadow-[#D86D3E]/30 flex flex-col items-center justify-center p-2 text-center">
            <Sparkles size={18} className="text-[#E7A66D] mb-1" />
            <span className="font-display font-bold text-xs tracking-tight text-white">CampusFlow</span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#A7B0BF]">Platform</span>
          </div>

          {/* 4 Interactive Satellite Role Nodes positioned around the perimeter */}
          {WORKFLOW_NODES.map((node) => {
            const rad = (node.angle * Math.PI) / 180;
            const x = Math.cos(rad) * node.distance;
            const y = Math.sin(rad) * node.distance;
            const isSelected = node.id === selectedId;
            const Icon = node.icon;

            return (
              <motion.button
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  transform: `translate(${x}px, ${y}px)`
                }}
                className={`absolute z-30 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isSelected
                    ? 'bg-[#1C1512] border-2 shadow-lg'
                    : 'bg-[#181310]/90 border border-white/15 text-[#A7B0BF] hover:text-white hover:border-white/40'
                }`}
                style={{
                  left: `calc(50% + ${x}px - 24px)`,
                  top: `calc(50% + ${y}px - 24px)`,
                  borderColor: isSelected ? node.color : undefined,
                  boxShadow: isSelected ? `0 0 20px ${node.color}40` : undefined,
                  color: isSelected ? node.color : undefined
                }}
                aria-label={`Select ${node.role}`}
                title={node.role}
              >
                <Icon size={20} />
              </motion.button>
            );
          })}
        </div>

        {/* Right: Selected Workflow Narrative Card */}
        <div className="relative z-10 flex flex-col justify-center">

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode.id}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-2xl grid place-items-center font-display font-bold text-base"
                  style={{
                    backgroundColor: `${selectedNode.color}20`,
                    color: selectedNode.color,
                    border: `1px solid ${selectedNode.color}40`
                  }}
                >
                  <selectedNode.icon size={20} />
                </span>
                <div>
                  <h3 className="font-display font-bold text-2xl text-white tracking-tight">
                    {selectedNode.role}
                  </h3>
                  <p className="font-mono text-xs text-[#A7B0BF]">
                    {selectedNode.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-5 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F4EFE8]">
                  <CheckCircle2 size={15} style={{ color: selectedNode.color }} />
                  <span>{selectedNode.status}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#A7B0BF]">
                  {selectedNode.details}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {WORKFLOW_NODES.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSelectedId(n.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      n.id === selectedId
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'text-[#A7B0BF] hover:text-white bg-transparent border border-transparent'
                    }`}
                  >
                    {n.role.split(' ')[0]}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
