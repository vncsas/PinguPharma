export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="text-sm text-accent-success bg-accent-success/5 border border-accent-success/20 rounded-lg px-3 py-2"
    >
      {message}
    </div>
  );
}
