import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <Link href="/" className="mb-10 inline-flex w-fit bg-[#FFFFFF]">
          <BrandLogo className="h-12" />
        </Link>
        {children}
      </div>
    </div>
  );
}
