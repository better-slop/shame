import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-foreground hover:text-shame-crimson transition-instant">
            <div className="size-8 rounded bg-shame-crimson/10 border border-shame-crimson/20 flex items-center justify-center">
              <span className="font-display text-sm text-shame-crimson">bs</span>
            </div>
            <span className="font-display text-lg tracking-wide">bs-shame</span>
          </Link>

          {/* Login link */}
          <Link
            to="/login"
            className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-instant"
          >
            <span>Login</span>
            <svg
              className="size-4 transition-transform duration-75 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
