import { HomeApproval } from "@/components/home/HomeApproval";
import { HomeFinalCta } from "@/components/home/HomeFinalCta";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeModes } from "@/components/home/HomeModes";
import { HomePillars } from "@/components/home/HomePillars";
import { HomeProducts } from "@/components/home/HomeProducts";
import { HomeSecurity } from "@/components/home/HomeSecurity";
import { HomeTom } from "@/components/home/HomeTom";
import { HomeWorkflow } from "@/components/home/HomeWorkflow";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      <HomeHero />
      <HomePillars />
      <HomeTom />
      <HomeWorkflow />
      <HomeProducts />
      <HomeApproval />
      <HomeSecurity />
      <HomeModes />
      <HomeFinalCta />
    </main>
  );
}
