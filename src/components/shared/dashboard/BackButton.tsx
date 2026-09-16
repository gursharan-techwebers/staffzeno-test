"use client";

import { ArrowLeftIcon, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

const BackButton = ({ className ="" }: { className?: string }) => {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={() => router.back()}
      className={`items-center justify-center mr-1 text-foreground/70 ${className}`}
    >
      <ChevronLeft className="size-4" />
      Back
    </Button>
  );
};

export default BackButton;
