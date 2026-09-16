import type { ReactNode } from "react";

type SettingsSectionProps = {
  sectionId: string;
  children: ReactNode;
};

const SettingsSection = ({ sectionId, children }: SettingsSectionProps) => {
  return (
    <section
      id={sectionId}
      className="scroll-mt-6 overflow-hidden rounded-xl border bg-card p-4 md:p-6"
    >
      {children}
    </section>
  );
};

export default SettingsSection;
