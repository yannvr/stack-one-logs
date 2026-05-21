import * as Toast from '@radix-ui/react-toast';
import { ArrowSquareOut, CheckCircle } from '@phosphor-icons/react';
import { useCallback, useMemo, useState } from 'react';

export type ToastVariant = 'success' | 'progress';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastItem = {
  id: number;
  title: string;
  variant: ToastVariant;
  action?: ToastAction;
};

type ToastContext = {
  show: (title: string, variant?: ToastVariant, action?: ToastAction) => void;
};

let nextId = 1;

export function useToasterState(): { items: ToastItem[]; ctx: ToastContext; dismiss: (id: number) => void } {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback(
    (title: string, variant: ToastVariant = 'success', action?: ToastAction) => {
      const id = nextId++;
      setItems((cur) => [...cur, { id, title, variant, action }]);
    },
    [],
  );
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
    <Toast.Provider duration={3000} swipeDirection="up">
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
          {item.action ? (
            <Toast.Action asChild altText={item.action.label}>
              <button type="button" className="toast-action" onClick={item.action.onClick}>
                {item.action.label}
                <ArrowSquareOut size={11} weight="regular" />
              </button>
            </Toast.Action>
          ) : null}
        </Toast.Root>
      ))}
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}
