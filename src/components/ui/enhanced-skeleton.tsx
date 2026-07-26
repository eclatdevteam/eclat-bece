import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted min-h-[20px]", className)} {...props} />;
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

function ListSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex space-x-4 mb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 mb-2">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ShimmerSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "animate-shimmer rounded-md bg-muted min-h-[20px]",
        "bg-gradient-to-r from-muted via-muted/50 to-muted",
        "bg-[length:200%_100%]",
        className
      )} 
      {...props} 
    />
  );
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: { 
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      {icon && (
        <div className="mb-4 text-muted-foreground animate-float">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      {action && <div className="animate-fade-in">{action}</div>}
    </div>
  );
}

function LoadingState({ 
  message = "Loading...", 
  className 
}: { 
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12", className)}>
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-muted-foreground animate-pulse-soft">{message}</p>
    </div>
  );
}

export { 
  Skeleton, 
  CardSkeleton, 
  ListSkeleton, 
  TableSkeleton, 
  ShimmerSkeleton,
  EmptyState,
  LoadingState
};
