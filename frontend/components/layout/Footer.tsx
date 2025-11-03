export function Footer() {
  return (
    <footer className="border-t bg-muted/30 backdrop-blur-sm mt-auto">
      <div className="container flex flex-col items-center justify-between gap-3 sm:gap-4 md:flex-row px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
        <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
          RSS Developer Suite - Comprehensive toolkit for RSS developers and publishers
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
          © {new Date().getFullYear()} RSS Developer Suite
        </p>
      </div>
    </footer>
  );
}
