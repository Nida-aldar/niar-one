import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <span className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
  );
}
