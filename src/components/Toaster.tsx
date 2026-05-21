import * as Toast from '@radix-ui/react-toast';
import { useCallback, useMemo, useState } from 'react';

import { CheckCircle } from '@phosphor-icons/react';

export type ToastVariant = 'success' | 'progress';

type ToastItem = {
  id: number;
  title: string;
  variant: ToastVariant;
};

type ToastContext = {
  show: (title: string, variant?: ToastVariant) => void;
};

let nextId = 1;

export function useToasterState(): { items: ToastItem[]; ctx: ToastContext; dismiss: (id: number) => void } {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((title: string, variant: ToastVariant = 'success') => {
    const id = nextId++;
    setItems((cur) => [...cur, { id, title, variant }]);
  }, []);
  const dismiss = useCallback((id: number) => {
    setItems((cur) => cur.filter((t) => t.id !== id));
  }, []);
  const ctx = useMemo(() => ({ show }), [show]);
  return { items, ctx, dismiss };
}

type ToasterProps = {
  items: ToastItem[];
  onDismiss: (id: number) => void;
};

export function Toaster({ items, onDismiss }: ToasterProps) {
  return (
    <Toast.Provider duration={2400} swipeDirection="up">
      {items.map((item) => (
        <Toast.Root
          key={item.id}
          className="toast"
          data-variant={item.variant}
          onOpenChange={(open) => {
            if (!open) onDismiss(item.id);
          }}
        >
          <Toast.Title className="toast-title">
            <CheckCircle size={14} weight="fill" />
            {item.title}
          </Toast.Title>
        </Toast.Root>
      ))}
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}
