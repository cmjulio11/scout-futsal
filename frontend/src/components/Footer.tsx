export default function Footer() {
  return (
    <footer className="w-full bg-slate-900/90 backdrop-blur border-t border-slate-800 py-4 pb-20 md:pb-4 px-4 sm:px-6 mt-auto print:bg-white print:border-slate-300 print:pb-2 print:pt-3">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center print:text-slate-800">
        <p className="text-slate-400 text-sm font-medium print:text-slate-700">
          <span className="text-blue-400 font-bold print:text-blue-700">Intelligent Futsal Scout</span>
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/30 print:border-blue-400 print:text-blue-800">
            v2.4
          </span>
          <span className="text-slate-500 print:text-slate-600"> | desenvolvido por </span>
          <span className="text-slate-200 font-semibold tracking-wide uppercase print:text-slate-900">JÚLIO MARTINS</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm print:text-slate-800">
          <a
            href="https://wa.me/5519992035026"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-300 hover:text-blue-400 transition-colors print:text-slate-800"
          >
            <span>📱</span>
            <span className="font-medium">WhatsApp: (19) 99203-5026</span>
          </a>
          <span className="text-slate-600 hidden sm:inline print:inline">•</span>
          <a
            href="https://instagram.com/juliocm.77"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-300 hover:text-pink-400 transition-colors print:text-slate-800"
          >
            <span>📸</span>
            <span className="font-medium">Instagram: @juliocm.77</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
