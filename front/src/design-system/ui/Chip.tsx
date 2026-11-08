
export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3 text-xs font-medium rounded-lg border ${
        active
          ? "bg-brand-500 text-white border-brand-500"
          : "bg-white text-ink border-line-strong hover:bg-surface-alt"
      }`}
    >
      {children}
    </button>
  );
}
