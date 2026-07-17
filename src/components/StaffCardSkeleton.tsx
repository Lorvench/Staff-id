/** Shimmer placeholder shown while the staff profile is loading. */
export default function StaffCardSkeleton() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-paper p-8 shadow-card-lg">
      <div className="flex flex-col items-center gap-4">
        <div className="skeleton h-6 w-32 rounded-md" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      <div className="mt-6 flex justify-center">
        <div className="skeleton h-32 w-32 rounded-full" />
      </div>
      <div className="mt-5 flex flex-col items-center gap-3">
        <div className="skeleton h-6 w-40 rounded" />
        <div className="skeleton h-4 w-28 rounded" />
        <div className="skeleton h-7 w-24 rounded-full" />
      </div>
      <div className="mt-8 space-y-5">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-4 w-32 rounded" />
      </div>
      <div className="mt-8 flex justify-center">
        <div className="skeleton h-52 w-52 rounded-2xl" />
      </div>
      <div className="mt-7">
        <div className="skeleton h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
