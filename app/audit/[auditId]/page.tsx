import type { ReactElement } from "react";
import { AuditResultsClient } from "./audit-results-client";

export default function AuditResultPage({ params }: { params: { auditId: string } }): ReactElement {
  return <AuditResultsClient auditId={params.auditId} />;
}
