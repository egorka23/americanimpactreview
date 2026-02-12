"use client";

interface BoardMember {
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

function MemberPhoto({ member }: { member: BoardMember }) {
  const initials = member.name
    .split(" ")
    .filter((p) => !p.includes(".") && !p.includes(","))
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  if (member.photo) {
    return (
      <div className="eb-photo">
        <img src={member.photo} alt={member.name} loading="lazy" />
      </div>
    );
  }

  return (
    <div className="eb-photo eb-photo--placeholder">
      <span>{initials}</span>
    </div>
  );
}

const leadership: BoardMember[] = [
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

const members: BoardMember[] = [
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

function OrcidIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 256 256" aria-hidden="true">
      <circle cx="128" cy="128" r="128" fill="#A6CE39" />
      <g fill="#fff">
        <circle cx="80.5" cy="68" r="11.5" />
        <rect x="73" y="90" width="15" height="97" rx="1" />
        <path d="M109 90h35c36 0 54 25 54 48.5S180 187 144 187h-35V90zm15 82h20c24 0 39-16 39-33.5S168 105 144 105h-20v67z" />
      </g>
    </svg>
  );
}

function ScholarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 256 256" aria-hidden="true">
      <circle cx="128" cy="128" r="128" fill="#4285F4" />
      <path d="M128 52L40 108l88 56 72-45.8v52.8h16V108z" fill="#fff" />
      <path d="M128 164L40 108l36-22.9L128 118z" fill="#A0C3FF" />
      <circle cx="128" cy="164" r="48" fill="#fff" />
      <path d="M152 142c2 5 3.5 11.5 3.5 18 0 26-17.5 43-47.5 43s-49.5-22-49.5-49 22-49 49.5-49c13.5 0 24 5 32.5 13l-13 12.5c-5-5-12.5-8-19.5-8-17 0-30 14-30 31.5s13 31.5 30 31.5c16 0 26-9 28-21.5H108v-17h43.5c.5 2.5.5 5 .5 7z" fill="#4285F4" />
    </svg>
  );
}

function PubMedIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#326599" />
      <g transform="translate(2, 2) scale(0.833)" fill="#fff">
        <path d="M8.23 7.982l.006-1.005C7.846 1.417 5.096 0 5.096 0l.048 2.291C3.73 1.056 2.6 1.444 2.6 1.444l.118 15.307s4.218-1.796 5.428 5.505C10.238 13.535 21.401 24 21.401 24V9S10.52-.18 8.231 7.982zm9.79 9.941l-1.046-5.232-1.904 4.507h-.96l-1.72-4.301-1.046 5.04H9.321l2.093-9.39h.802l2.491 5.543 2.508-5.557h.869l2.075 9.39h-2.138z" />
      </g>
    </svg>
  );
}

function ResearchGateIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 448 512" aria-hidden="true">
      <rect width="448" height="512" rx="64" fill="#00CCBB" />
      <path fill="#fff" d="M262.2 366.4c-6.6 3-33.2 6-50-14.2-9.2-10.6-25.3-33.3-42.2-63.6-8.9 0-14.7 0-21.4-.6v46.4c0 23.5 6 21.2 25.8 23.9v8.1c-6.9-.3-23.1-.8-35.6-.8-13.1 0-26.1.6-33.6.8v-8.1c15.5-2.9 22-1.3 22-23.9V225c0-22.6-6.4-21-22-23.9V193c25.8 1 53.1-.6 70.9-.6 31.7 0 55.9 14.4 55.9 45.6 0 21.1-16.7 42.2-39.2 47.5 13.6 24.2 30 45.6 42.2 58.9 7.2 7.8 17.2 14.7 27.2 14.7v7.3zm22.9-135c-23.3 0-32.2-15.7-32.2-32.2V167c0-12.2 8.8-30.4 34-30.4s30.4 17.9 30.4 17.9l-10.7 7.2s-5.5-12.5-19.7-12.5c-7.9 0-19.7 7.3-19.7 19.7v26.8c0 13.4 6.6 23.3 17.9 23.3 14.1 0 21.5-10.9 21.5-26.8h-17.9v-10.7h30.4c0 20.5 4.7 49.9-34 49.9zm-116.5 44.7c-9.4 0-13.6-.3-20-.8v-69.7c6.4-.6 15-.6 22.5-.6 23.3 0 37.2 12.2 37.2 34.5 0 21.9-15 36.6-39.7 36.6z" />
    </svg>
  );
}

function ProfileLinks({ member }: { member: BoardMember }) {
  const links = [];
  if (member.orcid) links.push({ href: member.orcid, label: "ORCID", icon: <OrcidIcon /> });
  if (member.scholar) links.push({ href: member.scholar, label: "Google Scholar", icon: <ScholarIcon /> });
  if (member.researchgate) links.push({ href: member.researchgate, label: "ResearchGate", icon: <ResearchGateIcon /> });
  if (member.pubmed) links.push({ href: member.pubmed, label: "PubMed", icon: <PubMedIcon /> });
  if (links.length === 0) return null;
  return (
    <div className="eb-links">
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="eb-link">
          {l.icon}
          <span>{l.label}</span>
        </a>
      ))}
    </div>
  );
}

function StatBadges({ stats }: { stats?: { label: string; value: string }[] }) {
  if (!stats || stats.length === 0) return null;
  return (
    <div className="eb-stats">
      {stats.map((s) => (
        <span key={s.label} className="eb-stat">
          <strong>{s.value}</strong> {s.label}
        </span>
      ))}
    </div>
  );
}

function LeaderCard({ member }: { member: BoardMember }) {
  return (
    <div className="eb-leader">
      <div className="eb-leader__top">
        <MemberPhoto member={member} />
        <div className="eb-leader__info">
          <div className="eb-leader__role">{member.role}</div>
          <h3 className="eb-leader__name">{member.name}</h3>
          {member.affiliation && <div className="eb-leader__aff">{member.affiliation}</div>}
        </div>
      </div>
      <StatBadges stats={member.stats} />
      <p className="eb-leader__bio">{member.bio}</p>
      <ProfileLinks member={member} />
    </div>
  );
}

function MemberRow({ member }: { member: BoardMember }) {
  return (
    <div className="eb-row">
      <div className="eb-row__top">
        <MemberPhoto member={member} />
        <div className="eb-row__info">
          <div className="eb-row__role">{member.role}</div>
          <h3 className="eb-row__name">{member.name}</h3>
          {member.affiliation && <div className="eb-row__aff">{member.affiliation}</div>}
        </div>
      </div>
      <StatBadges stats={member.stats} />
      <p className="eb-row__bio">{member.bio}</p>
      <ProfileLinks member={member} />
    </div>
  );
}

export default function EditorialBoardClient() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Journal</div>
          <h1>Editorial Board</h1>
          <p>
            The people behind American Impact Review.
          </p>
          <div className="page-meta">
            <span>Peer-Reviewed</span>
            <span>Open Access</span>
            <span>Editorial Independence</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="eb-leaders">
          {leadership.map((m) => (
            <LeaderCard key={m.name} member={m} />
          ))}
        </div>

        <div className="eb-divider">
          <span>Board Members</span>
        </div>

        <div className="eb-members">
          {members.map((m) => (
            <MemberRow key={m.name} member={m} />
          ))}
        </div>
      </section>
    </>
  );
}
