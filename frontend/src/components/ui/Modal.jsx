// Modal on Radix Dialog: focus trap, ESC, overlay + return focus come from
// Radix. Cinematic glass styling. Keeps the legacy { open, onClose, title } API.
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../system/tokens';

export function Modal({ open, onClose, title, children, wide, actions, description }) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-label={typeof title === 'string' ? title : undefined}
          className={cn(
            'fixed left-1/2 top-1/2 z-[71] -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-h-[92vh] overflow-y-auto',
            'glass-card bg-[var(--cf-surface)]/85 backdrop-blur-2xl border border-[var(--cf-line)] rounded-[24px] shadow-brutal-lg',
            'focus:outline-none focus-visible:outline-[3px] focus-visible:outline-[#D86D3E]',
            wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
          )}
        >
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[var(--cf-line)] sticky top-0 bg-[var(--cf-surface)]/85 backdrop-blur-2xl z-10 rounded-t-[24px]">
            <Dialog.Title className="font-display text-base font-bold tracking-tight text-[var(--cf-ink)]">
              {title}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close dialog"
              className="p-2 rounded-[14px] border border-transparent text-[var(--cf-ink-mute)] hover:bg-black/[.05] dark:hover:bg-white/10 hover:text-[var(--cf-ink)] focus-visible:outline-[3px] focus-visible:outline-[#D86D3E] transition"
            >
              <X size={16} />
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description className="px-5 sm:px-6 pt-3 text-sm text-[var(--cf-ink-mute)]">
              {description}
            </Dialog.Description>
          )}
          <div className="px-5 sm:px-6 py-5">{children}</div>
          {actions && (
            <div className="flex flex-wrap items-center justify-end gap-2 px-5 sm:px-6 pb-5">{actions}</div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Actions({ className, children }) {
  return <div className={cn('flex flex-wrap items-center justify-end gap-2', className)}>{children}</div>;
}

export const Root = Dialog.Root;
export const Trigger = Dialog.Trigger;
export const Content = Dialog.Content;
export const Title = Dialog.Title;
export const Close = Dialog.Close;
