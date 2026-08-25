import { notFound, redirect } from "next/navigation";
import { WorkspaceTodoMain } from "@/components/layout/WorkspaceChrome";
import { sellerTodoPages } from "@/lib/workspace/nav";

export const dynamic = "force-dynamic";

export default async function SellerSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "tom") {
    redirect("/consult?intent=sell");
  }
  const page = sellerTodoPages[slug];
  if (!page) notFound();
  return (
    <WorkspaceTodoMain
      screenId={page.screenId}
      title={page.title}
      note={page.note}
    />
  );
}
