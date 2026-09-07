import type { Metadata } from "next";
import { ServiceOverviewView } from "@/components/landing/ServiceOverviewView";
import { getCurrentContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "서비스 소개 | 베리컴 VERICOM",
  description:
    "베리컴은 M&A 거래의 탐색·분석·준비·검토·협상·실사·클로징까지의 과정을 AI와 디지털 워크플로우로 연결하는 AI 기반 M&A 운영 플랫폼입니다.",
};

export default async function ServiceOverviewPage() {
  const context = await getCurrentContext();
  const signedIn = Boolean(context);
  return <ServiceOverviewView signedIn={signedIn} />;
}
