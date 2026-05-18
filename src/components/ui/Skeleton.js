"use client";

export function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="product-card">
      <div className="skeleton aspect-square" />
      <div className="p-3 flex flex-col gap-2.5">
        <Skeleton className="h-3.5 w-4/5 rounded" />
        <Skeleton className="h-3.5 w-3/5 rounded" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function PageLoader({ messageEn = "Loading...", messageAr = "جاري التحميل..." }) {
  return (
    <div className="container py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-amber-100 border-t-amber-600 animate-spin" />
        <p className="text-stone-400 text-sm font-medium">{messageEn}</p>
      </div>
    </div>
  );
}
