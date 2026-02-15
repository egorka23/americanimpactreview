import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { visibleMembers, slugify, findMemberBySlug } from "../data";
import ClientRedirect from "./ClientRedirect";

export function generateStaticParams() {
  return visibleMembers.map((m) => ({ slug: slugify(m.name) }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const member = findMemberBySlug(params.slug);
  if (!member) return {};

  const title = `${member.name} — ${member.role} | American Impact Review`;
  const description = member.bio.length > 200
    ? member.bio.slice(0, 197) + "..."
    : member.bio;
  const url = `https://americanimpactreview.com/editorial-board/${params.slug}`;

  const ogImage = `https://americanimpactreview.com/og/${params.slug}.png`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      siteName: "American Impact Review",
      images: [{ url: ogImage, width: 1200, height: 630, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function MemberPage({
  params,
}: {
  params: { slug: string };
}) {
  const member = findMemberBySlug(params.slug);
  if (!member) notFound();
  return <ClientRedirect slug={params.slug} />;
}
