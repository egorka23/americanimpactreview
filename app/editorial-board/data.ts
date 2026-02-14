export interface BoardMember {
  name: string;
  role: string;
  affiliation: string;
  bio: string;
  photo?: string;
  stats?: { label: string; value: string }[];
  orcid?: string;
  scholar?: string;
  researchgate?: string;
  pubmed?: string;
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/,.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const leadership: BoardMember[] = [
  {
    name: "Egor B. Akimov, PhD",
    role: "Editor-in-Chief",
    photo: "/editorial/egor-akimov.webp",
    affiliation: "MERET Solutions, Madison, WI",
    stats: [
      { label: "Publications", value: "40+" },
      { label: "Citations", value: "850+" },
      { label: "h-index", value: "13" },
    ],
    bio: "Exercise physiologist and mental health researcher. Published on infrared thermal imaging of aerobic capacity, MCT1 and AGTR2 gene polymorphisms in endurance athletes, and psychophysiology of thermoregulation. Currently working in translational mental health research.",
    orcid: "https://orcid.org/0009-0005-1047-305X",
    scholar: "https://scholar.google.com/citations?user=Lso2fHIAAAAJ",
    researchgate: "https://www.researchgate.net/profile/Egor-Akimov-3",
    pubmed: "https://pubmed.ncbi.nlm.nih.gov/?term=akimov+eb",
  },
  {
    name: "John H. Greist, MD",
    role: "Deputy Editor-in-Chief",
    photo: "/editorial/john-greist.webp",
    affiliation:
      "University of Wisconsin School of Medicine and Public Health, Madison, WI",
    stats: [
      { label: "Publications", value: "300+" },
    ],
    bio: "Emeritus Professor of Psychiatry. His early work showed that computer interviews could predict suicide attempts more accurately than clinicians. Co-founded the Lithium Information Center and the Obsessive Compulsive Information Center. Authored clinical textbooks on OCD, anxiety, and depression. Princeton (BA), Indiana University School of Medicine (MD).",
    orcid: "https://orcid.org/0000-0002-4712-6132",
    researchgate: "https://www.researchgate.net/profile/John-Greist",
  },
];

export const members: BoardMember[] = [
  {
    name: "Ildus Akhmetov, MD, PhD",
    photo: "/editorial/ildus-akhmetov.webp",
    affiliation: "Liverpool John Moores University, Liverpool, UK",
    role: "Editorial Board Member",
    stats: [
      { label: "Publications", value: "242" },
      { label: "Citations", value: "10,500+" },
      { label: "h-index", value: "53" },
      { label: "Books", value: "5" },
      { label: "Patents", value: "4" },
    ],
    bio: "Reader in Genetics and Epigenetics at the Research Institute for Sport and Exercise Sciences. Catalogued 251 DNA polymorphisms associated with athletic performance, including ACTN3 and GALNT13 variants linked to sprint and power traits. Member of the Athlome Consortium for whole-genome sequencing of elite athletes.",
    orcid: "https://orcid.org/0000-0002-6335-4020",
    scholar: "https://scholar.google.com/citations?user=r-hyP5sAAAAJ",
    researchgate: "https://www.researchgate.net/profile/Ildus-Ahmetov",
  },
  {
    name: "Alexey Karelin, PhD",
    role: "Editorial Board Member",
    photo: "/editorial/alexey-karelin.webp",
    affiliation: "Independent Researcher",
    stats: [
      { label: "Publications", value: "13+" },
      { label: "Citations", value: "290+" },
      { label: "Patents", value: "1" },
    ],
    bio: "Embedded systems engineer and researcher. Published in IEEE Transactions on Industrial Electronics and IEEE Sensors Journal on catalytic gas sensors and wireless sensor networks for hazardous environments. US patent holder. Conference speaker (IEEE EUROCON 2025, Embedded Online Conference). Peer reviewer for IEEE journals.",
    scholar: "https://scholar.google.com/citations?user=gPJIebMAAAAJ",
    researchgate: "https://www.researchgate.net/scientific-contributions/Alexey-Karelin-2322138488",
  },
  {
    name: "Irina Bakhshiian, M.Ed.",
    role: "Editorial Board Member",
    photo: "/editorial/irina-bakhshiian.webp",
    affiliation: "Independent Researcher",
    stats: [
      { label: "Publications", value: "17+" },
      { label: "Books", value: "2" },
      { label: "Awards", value: "1" },
    ],
    bio: "Special education researcher specializing in the neuropsychological foundations of reading acquisition and dyslexia prevention. Master's in Defectology (Special Education). Developer of original evidence-based programs for early identification and remediation of reading difficulties in children with neurodevelopmental disorders. Author of the book 'Reading with Ease and Confidence.' Winner of the 'Effective Education 2023' national award. Member of the National Association of Special Education Teachers (USA), International Literacy Association (USA), and the Union of Defectologists of Russia. Featured expert in national media outlets on childhood literacy and dyslexia awareness.",
    orcid: "https://orcid.org/0009-0001-4091-3651",
    scholar: "https://scholar.google.com/citations?hl=en&user=yw3YGxMAAAAJ",
  },
  {
    name: "Alex Shvets, PhD",
    role: "Editorial Board Member",
    photo: "/editorial/alex-shvets.webp",
    affiliation: "University of Strasbourg / MIT (postdoc)",
    stats: [
      { label: "Publications", value: "25+" },
      { label: "Citations", value: "3,800+" },
    ],
    bio: "Computational physicist and ML engineer. PhD from the University of Strasbourg, postdoc at MIT. Marie Curie Fellowship alumnus. Kaggle Competitions Master (world rank 73rd among 100k+ competitors). Won 1st place in Camera Model Identification (582 teams) and MICCAI 2017 Endoscopic Vision SubChallenge. Published on deep learning for robotic instrument segmentation, bone age assessment, and angiodysplasia detection.",
    scholar: "https://scholar.google.com/citations?user=_eJ5xysAAAAJ",
    researchgate: "https://www.researchgate.net/scientific-contributions/Alexey-A-Shvets-2086639271",
    orcid: "https://orcid.org/0000-0001-9436-8241",
  },
];

export const allMembers = [...leadership, ...members];

export function findMemberBySlug(slug: string): BoardMember | undefined {
  return allMembers.find((m) => slugify(m.name) === slug);
}
