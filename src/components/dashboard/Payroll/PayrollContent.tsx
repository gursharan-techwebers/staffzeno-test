"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type PayrollContentProps = {
  canManagePayroll: boolean;
  slug: string;
};

const PayrollContent = ({ canManagePayroll, slug }: PayrollContentProps) => {
  const router = useRouter();

  useEffect(() => {
    if (!canManagePayroll) {
      router.replace(`/org${slug}`);
    }
  }, [router]);

  return <div>PayrollContent</div>;
};

export default PayrollContent;
