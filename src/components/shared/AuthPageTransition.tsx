"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";

const AuthPageTransition = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{
          opacity: 0,
          y: 5,
          filter: "blur(1px)",
        }}
        animate={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
        }}
        exit={{
          opacity: 0,
          y: -2,
          filter: "blur(1px)",
        }}
        transition={{
          duration: 0.36,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="w-full max-w-sm"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthPageTransition;