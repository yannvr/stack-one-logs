import * as RadixSwitch from '@radix-ui/react-switch';

type Props = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
};

export function Switch({ checked, onCheckedChange, label }: Props) {
  return (
    <label className="switch-row">
      <span>{label}</span>
      <RadixSwitch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="switch"
        aria-label={label}
      >
        <RadixSwitch.Thumb className="switch-thumb" />
      </RadixSwitch.Root>
    </label>
  );
}
