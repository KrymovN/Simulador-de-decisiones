type LevioMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export default function LevioMark({ className = "", size = "md" }: LevioMarkProps) {
  return (
    <span className={`levio-mark levio-mark-${size} ${className}`} aria-hidden="true">
      <span className="levio-mark-halo" />
      <span className="levio-mark-ring" />
      <span className="levio-mark-ring levio-mark-ring-inner" />
    </span>
  );
}
