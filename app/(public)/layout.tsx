import { Header } from "@/components/layout/Header";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { getCurrentContext } from "@/lib/auth/session";
import { resolvePostAuthPath } from "@/lib/auth/workspace-router";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getCurrentContext();
  const signedIn = Boolean(context);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-foreground">
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        본문으로 건너뛰기
      </a>
      <Header
        signedIn={signedIn}
        workspaceHref={context ? resolvePostAuthPath(context) : "/seller"}
      />
      <div id="top">{children}</div>
      <PublicFooter />
    </div>
  );
}
