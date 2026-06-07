import Image from "next/image";

type LevioMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export default function LevioMark({ className = "", size = "md" }: LevioMarkProps) {
  return (
    <span className={`levio-mark levio-mark-${size} ${className}`} aria-hidden="true">
      <Image
        className="levio-mark-image"
        src="/levio-reference-mark.png"
        alt=""
        width={64}
        height={64}
        unoptimized
      />
    </span>
  );
}
