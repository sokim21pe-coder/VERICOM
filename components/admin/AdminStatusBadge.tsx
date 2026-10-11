export function AdminStatusBadge({ status }: { status: string | null | undefined }) {
  const disabled = status === "disabled";
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
        disabled
          ? "border-line bg-[#F4F6F9] text-muted"
          : "border-line bg-white text-foreground"
      }`}
    >
      {disabled ? "Disabled" : "Active"}
    </span>
  );
}
