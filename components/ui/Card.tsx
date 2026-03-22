import clsx from "clsx";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-card border border-[var(--border)] bg-[var(--bg-secondary)] shadow-studify backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
