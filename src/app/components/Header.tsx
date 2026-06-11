export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 py-4 md:py-6">
      <div className="flex items-center justify-between gap-4">
        {/* Title section */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{title}</h2>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{subtitle}</p>}
        </div>
        {/* Logos - hidden on mobile, visible on tablet+ */}
        <div className="hidden sm:flex items-center gap-3 md:gap-4 flex-shrink-0">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FDOH_logo-removebg-preview.png?alt=media&token=382d0ab0-f203-40fd-b06d-d4d649dcfa72"
            alt="DOH Logo"
            className="h-10 md:h-12 object-contain"
          />
          <img
            src="https://firebasestorage.googleapis.com/v0/b/eap-environmental.firebasestorage.app/o/DDH%2FNueva_Vizcaya_Seal-removebg-preview.png?alt=media&token=c3afd64f-5db4-4ade-8949-c1e8a8860459"
            alt="Nueva Vizcaya Seal"
            className="h-10 md:h-12 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
