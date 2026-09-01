import { notFound } from "next/navigation";
import { WorkspaceTodoMain } from "@/components/layout/WorkspaceChrome";
import { expertTodoPages } from "@/lib/workspace/nav";

export const dynamic = "force-dynamic";

export default async function ExpertSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "tom") {
    return (
      <WorkspaceTodoMain
        screenId="E-TOM"
        title="TOM(AI)"
        note="전문가 TOM(AI) 연결은 후속 단계입니다."
      />
    );
  }
  const page = expertTodoPages[slug];
  if (!page) notFound();
  return (
    <WorkspaceTodoMain
      screenId={page.screenId}
      title={page.title}
      note={page.note}
    />
  );
}
