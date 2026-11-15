import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main
      className="min-h-screen px-6 py-10 md:px-10 md:py-14"
      style={{ backgroundImage: "var(--page-bg)" }}
    >
      <div className="mx-auto max-w-3xl">
        <Card className="border-border/60 bg-card/85 text-center shadow-xl shadow-black/10 backdrop-blur-sm dark:shadow-black/40">
          <CardHeader className="pb-2">
            <h1 className="text-3xl font-semibold tracking-tight text-card-foreground">
              Page not found
            </h1>
            <CardDescription className="text-base text-muted-foreground">
              This page doesn&apos;t exist. Start a new draft or go back to the home page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8 pt-2">
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/draft"
                className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Start a draft
              </Link>
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-secondary px-6 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
