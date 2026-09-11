export type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionIcon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};