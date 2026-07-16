import Image from "next/image";

type LevioMarkProps = {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
};

export default function LevioMark({ className = "", priority = false, size = "md" }: LevioMarkProps) {
  return (
    <span className={`levio-mark levio-mark-${size} ${className}`} aria-hidden="true">
      <Image
        className="levio-mark-image"
        src="/levio-reference-mark.png"
        alt=""
        width={64}
        height={64}
        unoptimized
        priority={priority}
      />
    </span>
  );
}
