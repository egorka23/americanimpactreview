"use client";

interface BoardMember {
  name: string;
  role: string;
  affiliation: string;
  bio: string;
  orcid?: string;
  scholar?: string;
  pubmed?: string;
}

const leadership: BoardMember[] = [
  {
    name: "Egor B. Akimov, PhD",
    role: "Editor-in-Chief",
    affiliation: "MERET Solutions Inc., Madison, WI",
    bio: "Exercise physiologist and mental health researcher. 40+ peer-reviewed publications, 480+ citations. Research interests: mental health, psychophysiology, and translational science. Founder, Global Talent Foundation 501(c)(3).",
    orcid: "https://orcid.org/0009-0005-1047-305X",
    scholar: "https://scholar.google.com/citations?user=Lso2fHIAAAAJ",
    pubmed: "https://pubmed.ncbi.nlm.nih.gov/?term=akimov+eb",
  },
  {
    name: "John H. Greist, MD",
    role: "Deputy Editor-in-Chief",
    affiliation:
      "University of Wisconsin School of Medicine and Public Health, Madison, WI",
    bio: "Emeritus Professor of Psychiatry. 300+ publications. Pioneer in computer-assisted mental health assessment and suicide risk evaluation. Princeton University (BA), Indiana University School of Medicine (MD).",
    orcid: "https://orcid.org/0000-0002-4712-6132",
  },
];

const members: BoardMember[] = [
  {
    name: "Ildus Akhmetov, MD, PhD",
    affiliation: "Liverpool John Moores University, Liverpool, UK",
    role: "Editorial Board Member",
    bio: "Reader in Genetics and Epigenetics, Research Institute for Sport and Exercise Sciences. 242 peer-reviewed articles, 5 books, 4 patents. Research interests: sports genomics, molecular physiology, ageing and longevity.",
    orcid: "https://orcid.org/0000-0002-6335-4020",
  },
  {
    name: "Tatiana Habruseva, PhD",
    role: "Editorial Board Member",
    affiliation: "Independent Researcher",
    bio: "16+ publications, 1,300+ citations. Marie Sklodowska-Curie Fellow. Research interests: AI for medical imaging, fetal health monitoring, and photonics.",
    scholar: "https://scholar.google.com/citations?user=iIgs33IAAAAJ",
  },
  {
    name: "Alexey Karelin, PhD",
    role: "Editorial Board Member",
    affiliation: 'Saint Petersburg Electrotechnical University "LETI"',
    bio: "13+ publications, 290+ citations. IEEE EUROCON presenter. US patent holder. Research interests: embedded systems, IoT sensor networks, and catalytic gas detection.",
    scholar: "https://scholar.google.com/citations?user=gPJIebMAAAAJ",
  },
  {
    name: "Alex Shvets, PhD",
    role: "Editorial Board Member",
    affiliation: "Independent Researcher",
    bio: "PhD in Computational Physics, University of Strasbourg. 25+ publications, 2,500+ citations. Marie Curie Fellowship alumnus. Research interests: machine learning, computer vision, and medical imaging.",
    scholar: "https://scholar.google.com/citations?user=_eJ5xysAAAAJ",
    orcid: "https://orcid.org/0000-0001-9436-8241",
  },
];

function OrcidIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 256 256" aria-hidden="true">
      <path d="M256 128c0 70.7-57.3 128-128 128S0 198.7 0 128 57.3 0 128 0s128 57.3 128 128z" fill="#A6CE39" />
      <path d="M86.3 186.2H70.9V79.1h15.4v107.1zm22.5 0h15.4v-64.1c0-6.4 0-12.5-.4-18.2l13.4-1c.6 4.7.6 9.7.6 14.5h.4c5-10.5 15.6-16 27.2-16 19.4 0 29.4 13.4 29.4 36.5v48.3h-15.4v-45.3c0-16.3-5.8-26.8-18.7-26.8-14.3 0-22 11-22 28v44.1h-15.4V186.2zM86.3 67.3c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z" fill="#fff" />
    </svg>
  );
}

function ScholarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 512 512" aria-hidden="true">
      <path d="M256 411.12L0 202.667 256 0l256 202.667z" fill="#4285F4" />
      <path d="M256 411.12L0 202.667l105.33-83.08L256 232.3z" fill="#356AC3" />
      <path d="M345.95 277.9c5.93 14.04 9.38 29.87 9.38 47.53 0 67.6-46.08 115.23-126 115.23-72.86 0-132-59.14-132-132s59.14-132 132-132c35.44 0 65.08 12.97 87.75 34.15l-35.58 34.2c-14.32-13.78-32.96-21-52.17-21-44.63 0-80.89 37.34-80.89 84.65s36.26 84.65 80.89 84.65c42.68 0 68.54-24.28 74.13-58.3H229.33V302.6h115.24c1.13 6.17 1.38 12.47 1.38 18.87z" fill="#76A7FA" />
    </svg>
  );
}

function PubMedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 300 300" aria-hidden="true">
      <rect width="300" height="300" rx="40" fill="#326599" />
      <text x="150" y="200" textAnchor="middle" fill="#fff" fontSize="180" fontWeight="700" fontFamily="serif">P</text>
    </svg>
  );
}

function ProfileLinks({ member }: { member: BoardMember }) {
  const links = [];
  if (member.orcid) links.push({ href: member.orcid, label: "ORCID", icon: <OrcidIcon /> });
  if (member.scholar) links.push({ href: member.scholar, label: "Google Scholar", icon: <ScholarIcon /> });
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

function LeaderCard({ member }: { member: BoardMember }) {
  return (
    <div className="eb-leader">
      <div className="eb-leader__role">{member.role}</div>
      <h3 className="eb-leader__name">{member.name}</h3>
      <div className="eb-leader__aff">{member.affiliation}</div>
      <p className="eb-leader__bio">{member.bio}</p>
      <ProfileLinks member={member} />
    </div>
  );
}

function MemberRow({ member }: { member: BoardMember }) {
  return (
    <div className="eb-row">
      <div className="eb-row__main">
        <h3 className="eb-row__name">{member.name}</h3>
        <div className="eb-row__aff">{member.affiliation}</div>
        <p className="eb-row__bio">{member.bio}</p>
        <ProfileLinks member={member} />
      </div>
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
            Meet the editors and researchers who lead American Impact Review,
            ensuring rigorous peer review and editorial independence.
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
