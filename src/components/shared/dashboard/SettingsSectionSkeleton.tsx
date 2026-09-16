type SettingsSectionSkeletonProps = {
  children?: React.ReactNode;
  className?: string;
};

const SettingsSectionSkeleton = ({
  children,
  className,
}: SettingsSectionSkeletonProps) => {
  return (
    <section
      className={["overflow-hidden rounded-xl border bg-card p-4 md:p-6", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
};

export default SettingsSectionSkeleton;
