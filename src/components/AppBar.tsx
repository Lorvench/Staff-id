"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import Button from "@/components/ui/Button";

/**
 * Top app bar for authenticated screens.
 * `nav` renders admin navigation; staff screens get the brand + logout only.
 */
export default function AppBar({
  email,
  nav,
}: {
  email: string;
  nav?: React.ReactNode;
}) {
  const router = useRouter();

  const logout = useMutation({
    mutationFn: () => apiClient.post("/api/auth/logout"),
    onSuccess: () => {
      router.replace("/login");
      router.refresh();
    },
  });

  return (
    <header className="sticky top-0 z-20 border-b border-paper-sunken/70 bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" aria-label="LHP home" className="shrink-0">
            <Image
              src="/logo.svg"
              alt="LHP — Lion Hospitality Partners"
              width={64}
              height={34}
              priority
            />
          </Link>
          {nav}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-ink-muted sm:inline">{email}</span>
          <Button
            variant="ghost"
            size="sm"
            loading={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 12H4m0 0l3.5-3.5M4 12l3.5 3.5M14 5h4a2 2 0 012 2v10a2 2 0 01-2 2h-4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
