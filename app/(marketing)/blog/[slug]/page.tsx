import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BLOG_POSTS, getBlogPost, type Block } from "@/lib/content/blog";
import { BlogCoverArt } from "@/components/brand/blog-motifs";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getBlogPost(slug);
  return { title: post?.title ?? "Blog" };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" />
        Blog
      </Link>

      <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide">
        <span className="text-brand-600">{post.category}</span>
        <span className="text-foreground/40">·</span>
        <span className="text-foreground/50">{formatDate(post.date)}</span>
        <span className="text-foreground/40">·</span>
        <span className="text-foreground/50">{post.readMinutes} min read</span>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{post.title}</h1>

      <BlogCoverArt slug={post.slug} className="mt-8 h-28 rounded-lg border border-border bg-brand-50 p-4" />

      <div className="mt-8 space-y-4">
        {post.body.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>

      <div className="mt-12 border-t border-border pt-6">
        <Link href="/blog" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          ← Back to all posts
        </Link>
      </div>
    </article>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.type === "h2") {
    return <h2 className="pt-3 text-xl font-semibold text-foreground">{block.text}</h2>;
  }
  if (block.type === "ul") {
    return (
      <ul className="list-disc space-y-1.5 pl-5 text-foreground/80">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p className="leading-relaxed text-foreground/80">{block.text}</p>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
}
