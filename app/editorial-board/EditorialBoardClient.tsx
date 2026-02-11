"use client";

const board = [
  {
    name: "Dr. Helena Barrett, PhD",
    role: "Editor-in-Chief",
    affiliation: "Johns Hopkins Bloomberg School of Public Health, Baltimore, MD",
    bio: "Health systems researcher focused on translational evidence and publication ethics. Former associate editor at BMC Public Health. COPE member since 2018.",
    image: "/editorial/images/board-01.jpg"
  },
  {
    name: "Dr. Mateo Alvarez, PhD, PE",
    role: "Deputy Editor, Engineering",
    affiliation: "Georgia Institute of Technology, Atlanta, GA",
    bio: "Leads cross-disciplinary reviews in energy and infrastructure innovation. Published 40+ peer-reviewed articles on sustainable engineering systems.",
    image: "/editorial/images/board-02.jpg"
  },
  {
    name: "Dr. Priya Natarajan, PhD",
    role: "Associate Editor, AI & Data",
    affiliation: "Stanford University, Department of Computer Science, Stanford, CA",
    bio: "Specializes in responsible machine learning and applied analytics. IEEE Senior Member. Editorial board member at Journal of AI Research.",
    image: "/editorial/images/board-03.jpg"
  },
  {
    name: "Dr. Samuel Okoro, MD, PhD",
    role: "Associate Editor, Medicine",
    affiliation: "Emory University School of Medicine, Atlanta, GA",
    bio: "Clinician-scientist focused on global health delivery and diagnostics. Reviewer for The Lancet Global Health and PLOS Medicine.",
    image: "/editorial/images/board-04.jpg"
  },
  {
    name: "Dr. Elise Morgan, PhD",
    role: "Associate Editor, Energy & Climate",
    affiliation: "National Renewable Energy Laboratory (NREL), Golden, CO",
    bio: "Renewable energy researcher with industry-scale deployment experience. Author of 30+ publications on solar integration and grid modernization.",
    image: "/editorial/images/board-05.jpg"
  },
  {
    name: "Dr. Adrian Wu, PhD",
    role: "Associate Editor, Robotics & Automation",
    affiliation: "Carnegie Mellon University, Robotics Institute, Pittsburgh, PA",
    bio: "Works on autonomous systems and human-robot collaboration. Program committee member at ICRA and IROS.",
    image: "/editorial/images/board-06.jpg"
  },
  {
    name: "Dr. Leila Haddad, PhD",
    role: "Associate Editor, Policy & Social Sciences",
    affiliation: "Georgetown University, McCourt School of Public Policy, Washington, DC",
    bio: "Studies evidence-based policy design and public impact evaluation. Consultant to the World Bank on research-to-policy translation.",
    image: "/editorial/images/board-07.jpg"
  },
  {
    name: "Dr. Marcus Bell, PhD",
    role: "Managing Editor",
    affiliation: "Global Talent Foundation Inc., Miami, FL",
    bio: "Oversees peer review workflow and production standards. 10+ years of editorial management experience across multidisciplinary journals.",
    image: "/editorial/images/board-08.jpg"
  },
  {
    name: "Dr. Sofia Grant, PhD, CIP",
    role: "Ethics Editor",
    affiliation: "University of Pennsylvania, Office of Research Integrity, Philadelphia, PA",
    bio: "Focus on research integrity, consent, and data-use compliance. Certified IRB Professional. Trained in COPE ethical oversight standards.",
    image: "/editorial/images/board-09.jpg"
  },
  {
    name: "Dr. Tessa Kline, PhD",
    role: "Statistical Editor",
    affiliation: "University of Michigan, Department of Biostatistics, Ann Arbor, MI",
    bio: "Ensures methodological rigor and reproducibility across submissions. Expert in clinical trial design and meta-analysis methodology.",
    image: "/editorial/images/board-10.jpg"
  }
];

export default function EditorialBoardClient() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Journal</div>
          <h1>Editorial Board</h1>
          <p>
            Dedicated editors ensuring rigorous, ethical, and high-impact publication.
          </p>
          <div className="page-meta">
            <span>Peer-Reviewed</span>
            <span>Open Access</span>
            <span>Editorial Independence</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="editorial-grid">
          {board.map((member) => (
            <article key={member.name} className="editorial-card">
              <div className="editorial-card__image">
                <img src={member.image} alt={member.name} />
              </div>
              <div className="editorial-card__body">
                <h3>{member.name}</h3>
                <p className="editorial-card__role">{member.role}</p>
                <p className="editorial-card__affiliation">{member.affiliation}</p>
                <p className="editorial-card__bio">{member.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
