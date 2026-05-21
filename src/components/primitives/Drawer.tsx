import * as Dialog from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: ReactNode;
  /** Optional accessible description (also shown visually inside the header). */
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Side-anchored drawer built on Radix Dialog.
 *
 * Why not Vaul: Vaul shines for mobile bottom sheets with drag-to-close
 * gestures. The Figma is desktop-first with a right-edge panel that already
 * has its own scroll body and keyboard nav. Radix Dialog + CSS positioning
 * is the simpler, lighter fit.
 */
export function Drawer({ open, onOpenChange, title, description, children, footer }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="drawer" aria-describedby={description ? undefined : 'drawer-no-description'}>
          <header className="drawer-header">
            <div className="drawer-header-title">
              <Dialog.Title asChild>{typeof title === 'string' ? <h2>{title}</h2> : title}</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="icon" aria-label="Close panel">
                <X size={16} weight="regular" />
              </button>
            </Dialog.Close>
          </header>
          {description ? (
            <Dialog.Description className="drawer-description">{description}</Dialog.Description>
          ) : (
            <Dialog.Description id="drawer-no-description" className="sr-only">
              Request detail panel
            </Dialog.Description>
          )}
          <div className="drawer-body">{children}</div>
          {footer ? <footer className="drawer-footer">{footer}</footer> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
