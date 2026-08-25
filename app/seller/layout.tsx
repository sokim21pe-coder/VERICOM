import { WorkspaceChrome } from "@/components/layout/WorkspaceChrome";

export const dynamic = "force-dynamic";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceChrome workspace="seller">{children}</WorkspaceChrome>;
}
