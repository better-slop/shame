import * as React from "react";

import { cn } from "@/lib/utils";

function StoneCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stone-card"
      className={cn("stone-card p-4 flex flex-col gap-3", className)}
      {...props}
    />
  );
}

function StoneCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stone-card-header"
      className={cn("flex items-start justify-between gap-3", className)}
      {...props}
    />
  );
}

function StoneCardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="stone-card-title"
      className={cn("font-display text-lg tracking-wide text-foreground", className)}
      {...props}
    />
  );
}

function StoneCardMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stone-card-meta"
      className={cn("text-xs text-muted-foreground flex items-center gap-2", className)}
      {...props}
    />
  );
}

function StoneCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stone-card-content"
      className={cn("text-sm text-foreground/80", className)}
      {...props}
    />
  );
}

function StoneCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stone-card-footer"
      className={cn(
        "flex items-center gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

type ShameBadgeProps = React.ComponentProps<"span"> & {
  count?: number;
};

function ShameBadge({ className, count, children, ...props }: ShameBadgeProps) {
  return (
    <span data-slot="shame-badge" className={cn("shame-badge", className)} {...props}>
      {count !== undefined && <span className="font-semibold">{count}</span>}
      {children}
    </span>
  );
}

export {
  StoneCard,
  StoneCardHeader,
  StoneCardTitle,
  StoneCardMeta,
  StoneCardContent,
  StoneCardFooter,
  ShameBadge,
};
