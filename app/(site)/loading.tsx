export default function SiteLoading() {
  return (
    <div className="container-page pb-16 pt-28 md:pt-32" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="skeleton mb-3 h-3 w-24 rounded" />
      <div className="skeleton h-9 w-64 rounded-lg" />
      <div className="skeleton mt-4 h-3 w-full max-w-xl rounded" />
      <div className="skeleton mt-2 h-3 w-2/3 max-w-md rounded" />
      <div className="mt-8 grid grid-cols-2 gap-x-3.5 gap-y-7 sm:grid-cols-3 md:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index}>
            <div className="skeleton aspect-[2/3] w-full rounded-xl" />
            <div className="skeleton mt-3 h-3.5 w-3/4 rounded" />
            <div className="skeleton mt-2 h-2.5 w-1/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
