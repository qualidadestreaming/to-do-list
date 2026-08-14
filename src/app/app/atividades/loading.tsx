import { Skeleton } from "@/components/ui/skeleton";

export default function AtividadesLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-56 rounded-lg" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="space-y-2 rounded-xl border bg-card p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
