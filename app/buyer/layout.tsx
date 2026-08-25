import { WorkspaceChrome } from "@/components/layout/WorkspaceChrome";

export const dynamic = "force-dynamic";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceChrome workspace="buyer">{children}</WorkspaceChrome>;
}
