import { notFound, redirect } from "next/navigation";
import { WorkspaceTodoMain } from "@/components/layout/WorkspaceChrome";
import { buyerTodoPages } from "@/lib/workspace/nav";

export const dynamic = "force-dynamic";

export default async function BuyerSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "tom") {
    redirect("/consult?intent=buy");
  }
  const page = buyerTodoPages[slug];
  if (!page) notFound();
  return (
    <WorkspaceTodoMain
      screenId={page.screenId}
      title={page.title}
      note={page.note}
    />
  );
}
