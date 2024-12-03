export function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full mb-2 hidden group-hover:block">
        <div className="bg-gray-900 text-white text-sm rounded px-2 py-1">
          {content}
        </div>
      </div>
    </div>
  );
} 