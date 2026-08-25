import Image from "next/image";

const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 396;

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  className = "h-11 sm:h-12",
  priority = false,
}: BrandLogoProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center bg-[#FFFFFF] ${className}`}
    >
      <Image
        src="/brand/vericom-logo.jpg"
        alt="베리컴 VERICOM — M&A, Your Way"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        quality={95}
        sizes="180px"
        className="h-full w-auto max-w-none bg-[#FFFFFF] object-contain object-left"
        style={{ width: "auto", height: "100%" }}
      />
    </span>
  );
}
