import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceExplainView } from "@/components/landing/ServiceExplainView";
import {
  LANDING_SERVICE_SLUGS,
  getLandingServicePage,
} from "@/lib/landing/service-pages";
import { getCurrentContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return LANDING_SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getLandingServicePage(slug);
  if (!page) return { title: "베리컴 VERICOM | M&A, Your Way" };
  return {
    title: `${page.title} | 베리컴 VERICOM`,
    description: page.lead,
  };
}

export default async function AboutServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getLandingServicePage(slug);
  if (!page) notFound();

  const context = await getCurrentContext();
  return <ServiceExplainView page={page} signedIn={Boolean(context)} />;
}
