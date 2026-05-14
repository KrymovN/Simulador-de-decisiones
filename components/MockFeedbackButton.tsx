"use client";

import { useState } from "react";

type MockFeedbackButtonProps = {
  label: string;
  feedback: string;
  className?: string;
};

export default function MockFeedbackButton({ label, feedback, className }: MockFeedbackButtonProps) {
  const [message, setMessage] = useState("");

  function handleClick() {
    setMessage(feedback);
    window.setTimeout(() => setMessage(""), 2800);
  }

  return (
    <span className="mock-action-control">
      <button className={className} onClick={handleClick} type="button">
        {label}
      </button>
      {message && (
        <small className="inline-feedback" role="status">
          {message}
        </small>
      )}
    </span>
  );
}
