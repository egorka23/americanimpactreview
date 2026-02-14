import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allMembers, slugify, findMemberBySlug } from "../data";
import ClientRedirect from "./ClientRedirect";

export function generateStaticParams() {
  return allMembers.map((m) => ({ slug: slugify(m.name) }));
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
