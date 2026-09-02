import { Skeleton } from "@/components/ui/Skeleton";

export default function RootLoading() {
  return (
    <div className="space-y-8 py-12" role="status" aria-label="Memuat halaman">
      <div className="mx-auto max-w-4xl space-y-4 text-center">
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="mx-auto h-10 w-3/4" />
        <Skeleton className="mx-auto h-10 w-1/2" />
        <Skeleton className="mx-auto h-4 w-2/3" />
        <div className="flex items-center justify-center gap-3 pt-2">
          <Skeleton className="h-11 w-40 rounded-lg" />
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-gray-200 bg-white p-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
