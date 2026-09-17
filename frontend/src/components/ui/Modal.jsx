// Modal on Radix Dialog: focus trap, ESC, overlay + return focus come from
// Radix. Brutal styling only. Keeps the legacy { open, onClose, title } API.
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
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-coal/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-label={typeof title === 'string' ? title : undefined}
          className={cn(
            'fixed left-1/2 top-1/2 z-[71] -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-h-[92vh] overflow-y-auto',
            'bg-[var(--cf-surface)] border-2 border-[var(--cf-ink)] rounded-2xl shadow-brutal-lg',
            'focus:outline-none focus-visible:outline-[3px] focus-visible:outline-royal',
            wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
          )}
        >
          <div className="racing-stripe h-2 rounded-t-[14px]" aria-hidden />
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b-2 border-[var(--cf-ink)] sticky top-0 bg-[var(--cf-surface)] z-10">
            <Dialog.Title className="font-display text-base font-bold tracking-tight text-[var(--cf-ink)]">
              {title}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close dialog"
              className="p-2 rounded-lg border-2 border-transparent text-[var(--cf-ink-mute)] hover:border-[var(--cf-ink)] hover:bg-volt hover:text-coal transition"
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
