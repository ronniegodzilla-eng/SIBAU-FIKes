'use client';

export default function Modal({
  title,
  onClose,
  maxWidthClass = 'max-w-[460px]',
  children,
}: {
  title: string;
  onClose: () => void;
  maxWidthClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[9997] flex items-center justify-center bg-ink/45 p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`max-h-[90vh] w-full overflow-auto rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] ${maxWidthClass}`}
      >
        <div className="mb-4 text-[15.5px] font-extrabold text-ink">{title}</div>
        {children}
      </div>
    </div>
  );
}
