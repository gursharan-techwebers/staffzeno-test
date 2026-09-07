"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

const BackButton = () => {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => router.back()}
      className="gap-2"
    >
      <ArrowLeftIcon className="size-4" />
    </Button>
  );
};

export default BackButton;
