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
    bio: "Exercise physiologist and mental health researcher with 40+ peer-reviewed publications and 480+ citations. His work spans thermoregulation, sports genomics, and psychophysiology — including landmark studies linking infrared thermal portraits to aerobic capacity and gene polymorphisms (MCT1, AGTR2) to endurance performance. Currently focused on translational mental health research. Founder, Global Talent Foundation 501(c)(3).",
    orcid: "https://orcid.org/0009-0005-1047-305X",
    scholar: "https://scholar.google.com/citations?user=Lso2fHIAAAAJ",
    pubmed: "https://pubmed.ncbi.nlm.nih.gov/?term=akimov+eb",
  },
  {
    name: "John H. Greist, MD",
    role: "Deputy Editor-in-Chief",
    affiliation:
      "University of Wisconsin School of Medicine and Public Health, Madison, WI",
    bio: "Emeritus Professor of Psychiatry with 300+ publications. A pioneer in computer-assisted mental health — his early work demonstrated that computer interviews could predict suicide attempts more accurately than clinicians. Co-founder of the Lithium Information Center and the Obsessive Compulsive Information Center. Author of multiple clinical textbooks on OCD, anxiety, and depression treatment. Princeton University (BA), Indiana University School of Medicine (MD).",
    orcid: "https://orcid.org/0000-0002-4712-6132",
  },
];

const members: BoardMember[] = [
  {
    name: "Ildus Akhmetov, MD, PhD",
    affiliation: "Liverpool John Moores University, Liverpool, UK",
    role: "Editorial Board Member",
    bio: "Reader in Genetics and Epigenetics at the Research Institute for Sport and Exercise Sciences. Author of 242 peer-reviewed articles, 5 books, and holder of 4 patents. A leading authority in sports genomics — his research has catalogued 251 DNA polymorphisms associated with athletic performance, including key findings on ACTN3 and GALNT13 gene variants linked to sprint and power traits. Member of the Athlome Consortium for whole-genome sequencing of elite athletes.",
    orcid: "https://orcid.org/0000-0002-6335-4020",
  },
  {
    name: "Tatiana Habruseva, PhD",
    role: "Editorial Board Member",
    affiliation: "",
    bio: "Physicist with 16+ publications and 1,300+ citations. Marie Sklodowska-Curie Fellow. Her research bridges photonics and AI — from demonstrating coherence dynamics in quantum-dot mode-locked lasers (published in Physical Review Letters) to developing deep learning models for fetal ultrasound analysis and medical imaging. Former researcher at Aston Institute of Photonic Technologies and Tyndall National Institute.",
    scholar: "https://scholar.google.com/citations?user=iIgs33IAAAAJ",
  },
  {
    name: "Alexey Karelin, PhD",
    role: "Editorial Board Member",
    affiliation: "",
    bio: "Embedded systems researcher with 13+ publications and 290+ citations across IEEE Transactions on Industrial Electronics, IEEE Sensors Journal, and Sensors and Actuators B. His work on catalytic gas sensors and wireless sensor networks for hazardous environment monitoring has advanced methods for measuring flammable gas concentrations in unknown mixtures. US patent holder. IEEE EUROCON 2025 presenter on execution-time benchmarking across Cortex-M architectures.",
    scholar: "https://scholar.google.com/citations?user=gPJIebMAAAAJ",
  },
  {
    name: "Alex Shvets, PhD",
    role: "Editorial Board Member",
    affiliation: "",
    bio: "PhD in Computational Physics from the University of Strasbourg. 25+ publications, 3,800+ citations. Marie Curie Fellowship alumnus. Kaggle competition winner (1st place, Camera Model Identification among 591 teams). His research spans deep learning architectures for image segmentation, bone age assessment, and gastrointestinal lesion detection — contributing to state-of-the-art methods at the intersection of computer vision and clinical diagnostics.",
    scholar: "https://scholar.google.com/citations?user=_eJ5xysAAAAJ",
    orcid: "https://orcid.org/0000-0001-9436-8241",
  },
];

function OrcidIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" aria-hidden="true">
      <circle cx="128" cy="128" r="128" fill="#A6CE39" />
      <g fill="#fff">
        <circle cx="79.3" cy="67.3" r="10" />
        <path d="M86.3 186.2H72.3V90h14v96.2z" />
        <path d="M108.9 90h38.2c33.4 0 50.3 24.5 50.3 48.1 0 25.3-18.8 48.1-50.3 48.1h-38.2V90zm14 82.6h22.8c25.6 0 37.5-18 37.5-34.5 0-17.4-11.8-34.5-37.5-34.5h-22.8v69z" />
      </g>
    </svg>
  );
}

function ScholarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 512 512" aria-hidden="true">
      <circle cx="256" cy="256" r="256" fill="#4285F4" />
      <g transform="translate(80, 100) scale(0.7)">
        <path d="M256 411.12L0 202.667 256 0l256 202.667z" fill="#fff" />
        <path d="M256 411.12L0 202.667l105.33-83.08L256 232.3z" fill="#A0C3FF" />
        <circle cx="256" cy="362" r="120" fill="#fff" />
        <path d="M310 296c4 10 6.5 22 6.5 35 0 50-34 84-92 84s-96-43-96-96 43-96 96-96c26 0 47 9.5 64 25l-26 25c-10-10-24-15-38-15-33 0-59 27-59 61s26 61 59 61c31 0 50-18 54-42h-54v-33h84c.8 4.5 1.2 9 1.2 13.7z" fill="#4285F4" />
      </g>
    </svg>
  );
}

function PubMedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" aria-hidden="true">
      <circle cx="128" cy="128" r="128" fill="#326599" />
      <g fill="#fff">
        <path d="M80 80h36c22 0 36 14 36 33s-14 33-36 33H96v34H80V80zm16 52h18c13 0 21-7 21-19s-8-19-21-19H96v38z" />
        <path d="M156 180V118c0-8-4-13-12-13-9 0-14 6-14 15v60h-12V98h12v8c4-6 10-10 18-10 14 0 20 9 20 23v61h-12z" />
      </g>
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
      {member.affiliation && <div className="eb-leader__aff">{member.affiliation}</div>}
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
        {member.affiliation && <div className="eb-row__aff">{member.affiliation}</div>}
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
