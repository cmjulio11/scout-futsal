export default function Footer() {
  return (
    <footer className="w-full bg-slate-900/90 backdrop-blur border-t border-slate-800 py-4 pb-20 md:pb-4 px-4 sm:px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
        <p className="text-slate-400 text-sm font-medium">
          <span className="text-blue-400 font-bold">Intelligent Futsal Scout</span>
          <span className="text-slate-500"> | desenvolvido por </span>
          <span className="text-slate-200 font-semibold tracking-wide uppercase">JÚLIO MARTINS</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href="https://wa.me/5519992035026"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-300 hover:text-blue-400 transition-colors"
          >
            <span>📱</span>
            <span className="font-medium">WhatsApp: (19) 99203-5026</span>
          </a>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <a
            href="https://instagram.com/juliocm.77"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-300 hover:text-pink-400 transition-colors"
          >
            <span>📸</span>
            <span className="font-medium">Instagram: @juliocm.77</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
