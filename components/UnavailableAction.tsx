type UnavailableActionProps = {
  label: string;
  explanation: string;
  className?: string;
};

export default function UnavailableAction({
  label,
  explanation,
  className,
}: UnavailableActionProps) {
  return (
    <span className="unavailable-action">
      <button className={className} disabled type="button">
        {label}
      </button>
      <small>{explanation}</small>
    </span>
  );
}
