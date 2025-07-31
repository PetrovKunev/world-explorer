export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-2 px-3 sm:py-3 sm:px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-center items-center text-xs text-gray-600 space-y-1 sm:space-y-0">
        <span>© {currentYear} - World Explorer - </span>
        <a 
          href="https://kunev.dev" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 transition-colors duration-200 sm:ml-1"
        >
          kunev.dev
        </a>
      </div>
    </footer>
  );
} 