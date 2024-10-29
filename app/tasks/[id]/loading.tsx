import { Skeleton } from "@/components/ui/skeleton"

export default function TaskDetailSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Back button skeleton */}
      <Skeleton className="h-10 w-20 mb-6" />

      <div className="space-y-8">
        {/* Title and assigner skeleton */}
        <div>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </div>

        {/* Image skeleton */}
        <div>
          <Skeleton className="h-6 w-48 mb-4" /> {/* "Task Visualization" header */}
          <Skeleton className="w-full h-[400px] rounded-lg" />
        </div>

        {/* Subtasks skeleton */}
        <div>
          <Skeleton className="h-6 w-32 mb-4" /> {/* "Subtasks" header */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 