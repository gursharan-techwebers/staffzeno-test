import Image from "next/image";
import Link from "next/link";

const OnboardingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid min-h-svh py-15 md:py-0">
      <div className="relative flex flex-col gap-4 px-6 md:px-10 py-20 md:py-26">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 md:top-10 md:left-10 md:translate-x-0">
          <Link href={"/"}>
            <Image
              src="/logos/primary/staffzeno_primary_logo_dual_tone.svg"
              alt="StaffZeno"
              width={200}
              height={200}
              className="h-auto w-30 md:w-33"
            />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md border border-border/60 bg-muted rounded-2xl px-6 py-8 md:p-12">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;
