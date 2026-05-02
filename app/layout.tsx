import type { ReactNode } from "react";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  console.log("UPDATED"); // 👈 добавь это
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}