import type { ReactElement } from "react";

export function SkipToMain(): ReactElement {
  return (
    <a href="#main" className="skip-to-main">
      Skip to main content
    </a>
  );
}
