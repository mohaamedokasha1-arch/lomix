export function ToggleField({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-white/8 bg-ink-950/30 px-3 py-2.5">
      <div className="min-w-0">
        <label htmlFor={`toggle-${name}`} className="block text-[0.72rem] font-medium text-ink-100">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[0.6rem] leading-4 text-ink-500">{description}</p>}
      </div>
      <input type="hidden" name={name} value="false" />
      <input
        id={`toggle-${name}`}
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brass-400"
      />
    </div>
  );
}
