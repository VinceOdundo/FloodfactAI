import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSortedBlogPosts } from "@/lib/content/blog";
import { BlogCoverArt } from "@/components/brand/blog-motifs";

export const metadata: Metadata = { title: "Blog" };

const CATEGORY_COLOR: Record<string, string> = {
  Product: "text-brand-600",
  Engineering: "text-elevated",
  Community: "text-safe",
  Partnerships: "text-false-info",
};

export default function BlogIndexPage() {
  const posts = getSortedBlogPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Blog</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        How the system works, and what we know about flood safety
      </h1>
      <p className="mt-3 max-w-2xl text-foreground/70">
        Notes on the engineering, the pilot, and general flood-safety guidance — written by the team
        building FloodFact AI.
      </p>

      {featured && (
        <Link href={`/blog/${featured.slug}`} className="group mt-10 block">
          <article className="overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-brand-500">
            <BlogCoverArt slug={featured.slug} className="h-32 border-b border-border bg-brand-50 p-5 sm:h-40" />
            <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide">
              <span className={CATEGORY_COLOR[featured.category] ?? "text-brand-600"}>{featured.category}</span>
              <span className="text-foreground/40">·</span>
              <span className="text-foreground/50">{formatDate(featured.date)}</span>
              <span className="text-foreground/40">·</span>
              <span className="text-foreground/50">{featured.readMinutes} min read</span>
            </div>
            <h2 className="mt-3 flex items-start gap-2 text-2xl font-semibold text-foreground">
              {featured.title}
              <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-foreground/30 transition-colors group-hover:text-brand-600" />
            </h2>
            <p className="mt-2 max-w-2xl text-foreground/70">{featured.excerpt}</p>
            </div>
          </article>
        </Link>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {rest.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
            <article className="h-full overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-brand-500">
              <BlogCoverArt slug={post.slug} className="h-20 border-b border-border bg-brand-50 p-3" />
              <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <span className={CATEGORY_COLOR[post.category] ?? "text-brand-600"}>{post.category}</span>
                <span className="text-foreground/40">·</span>
                <span className="text-foreground/50">{post.readMinutes} min</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-foreground group-hover:text-brand-600">
                {post.title}
              </h3>
              <p className="mt-1.5 text-sm text-foreground/70">{post.excerpt}</p>
              <p className="mt-3 text-xs text-foreground/45">{formatDate(post.date)}</p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
}
