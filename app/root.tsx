import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { HeroUIProvider } from "@heroui/react";

import type { Route } from "./+types/root";
import { useServiceWorker } from "~/hooks";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/images/logo-icon.png", type: "image/png" },
  { rel: "manifest", href: "/manifest.json" },
  { rel: "apple-touch-icon", href: "/icons/icon-192x192.png" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#d2ab67" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ARL Intranet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="ARL Intranet" />
        <meta name="msapplication-TileColor" content="#1a1a1a" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <title>ARL Intranet | Adamus Resources Limited</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Register service worker for PWA functionality
  useServiceWorker();

  return (
    <HeroUIProvider>
      <Outlet />
    </HeroUIProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let status = 500;
  let title = "Something went wrong";
  let message = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = error.status === 404 ? "Page Not Found" : "Error";
    message =
      error.status === 404
        ? "The page you're looking for doesn't exist."
        : error.statusText || message;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    message = error.message;
  }

  return (
    <HeroUIProvider>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-6xl font-bold text-gold-500">{status}</p>
          <h1 className="mt-4 text-2xl font-semibold text-navy-900">{title}</h1>
          <p className="mt-2 text-gray-600">{message}</p>
          <div className="mt-6 flex justify-center gap-4">
            <a
              href="/"
              className="rounded-lg bg-gold-500 px-6 py-2 font-medium text-navy-900 transition-colors hover:bg-gold-600"
            >
              Go Home
            </a>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </HeroUIProvider>
  );
}
