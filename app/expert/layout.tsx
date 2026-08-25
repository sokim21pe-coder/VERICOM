import { WorkspaceChrome } from "@/components/layout/WorkspaceChrome";

export const dynamic = "force-dynamic";

export default function ExpertLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceChrome workspace="expert">{children}</WorkspaceChrome>;
}
