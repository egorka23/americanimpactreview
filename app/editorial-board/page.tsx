import type { Metadata } from "next";
import EditorialBoardClient from "./EditorialBoardClient";

export const metadata: Metadata = {
  title: "Editorial Board",
  description:
    "Editorial board of American Impact Review: Egor Akimov (Editor-in-Chief), John Greist (Deputy Editor), Ildus Akhmetov, Tatiana Habruseva, Alexey Karelin, Alex Shvets.",
  alternates: {
    canonical: "https://americanimpactreview.com/editorial-board",
  },
  openGraph: {
    title: "Editorial Board | American Impact Review",
    description:
      "Editorial board of American Impact Review: Egor Akimov (Editor-in-Chief), John Greist (Deputy Editor), Ildus Akhmetov, Tatiana Habruseva, Alexey Karelin, Alex Shvets.",
    url: "https://americanimpactreview.com/editorial-board",
  },
  twitter: {
    card: "summary_large_image",
    title: "Editorial Board | American Impact Review",
    description:
      "Editorial board of American Impact Review: Egor Akimov (Editor-in-Chief), John Greist (Deputy Editor), Ildus Akhmetov, Tatiana Habruseva, Alexey Karelin, Alex Shvets.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Editorial Board",
  url: "https://americanimpactreview.com/editorial-board",
  description:
    "Editorial board of American Impact Review, a peer-reviewed multidisciplinary journal published by Global Talent Foundation.",
  isPartOf: {
    "@type": "Periodical",
    name: "American Impact Review",
    url: "https://americanimpactreview.com",
  },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "Person",
        name: "Egor B. Akimov",
        jobTitle: "Editor-in-Chief",
        affiliation: { "@type": "Organization", name: "MERET Solutions" },
        sameAs: [
          "https://orcid.org/0009-0005-1047-305X",
          "https://scholar.google.com/citations?user=Lso2fHIAAAAJ",
          "https://www.researchgate.net/profile/Egor-Akimov-3",
        ],
      },
      {
        "@type": "Person",
        name: "John H. Greist",
        jobTitle: "Deputy Editor-in-Chief",
        affiliation: {
          "@type": "Organization",
          name: "University of Wisconsin School of Medicine and Public Health",
        },
        sameAs: [
          "https://orcid.org/0000-0002-4712-6132",
          "https://www.researchgate.net/profile/John-Greist",
        ],
      },
      {
        "@type": "Person",
        name: "Ildus Akhmetov",
        jobTitle: "Editorial Board Member",
        affiliation: {
          "@type": "Organization",
          name: "Liverpool John Moores University",
        },
        sameAs: [
          "https://orcid.org/0000-0002-6335-4020",
          "https://scholar.google.com/citations?user=r-hyP5sAAAAJ",
          "https://www.researchgate.net/profile/Ildus-Ahmetov",
        ],
      },
      {
        "@type": "Person",
        name: "Tatiana Habruseva",
        jobTitle: "Editorial Board Member",
        sameAs: [
          "https://scholar.google.com/citations?user=iIgs33IAAAAJ",
          "https://www.researchgate.net/profile/Tatiana_Habruseva",
        ],
      },
      {
        "@type": "Person",
        name: "Alexey Karelin",
        jobTitle: "Editorial Board Member",
        sameAs: [
          "https://scholar.google.com/citations?user=gPJIebMAAAAJ",
          "https://www.researchgate.net/scientific-contributions/Alexey-Karelin-2322138488",
        ],
      },
      {
        "@type": "Person",
        name: "Alex Shvets",
        jobTitle: "Editorial Board Member",
        sameAs: [
          "https://orcid.org/0000-0001-9436-8241",
          "https://scholar.google.com/citations?user=_eJ5xysAAAAJ",
          "https://www.researchgate.net/scientific-contributions/Alexey-A-Shvets-2086639271",
        ],
      },
    ],
  },
};

export default function EditorialBoardPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EditorialBoardClient />
    </>
  );
}
