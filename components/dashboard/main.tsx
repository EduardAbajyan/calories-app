export default function DashboardContent({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
      <div className="p-0 sm:ml-64">
        <div className="p-4">
          <div className="flex items-center justify-center h-24 rounded-base bg-neutral-secondary-soft">
            <p className="text-fg-disabled">
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 12h14m-7 7V5"
                />
              </svg>
            </p>
          </div>
        </div>
        {children}
      </div>
    );
}