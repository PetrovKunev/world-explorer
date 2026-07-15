export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50 px-3 py-2 sm:px-4 sm:py-3">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center space-y-1 text-xs text-gray-600 sm:flex-row sm:space-y-0">
        <span>© {currentYear} World Explorer —</span>
        <a
          href="https://kunev.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 transition-colors duration-200 hover:text-blue-800 sm:ml-1"
        >
          kunev.dev
        </a>
      </div>
    </footer>
  )
}
