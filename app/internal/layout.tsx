import { WorkspaceChrome } from "@/components/layout/WorkspaceChrome";

export const dynamic = "force-dynamic";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceChrome workspace="internal">{children}</WorkspaceChrome>;
}
