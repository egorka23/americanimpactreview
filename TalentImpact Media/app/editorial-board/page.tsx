"use client";

const board = [
  {
    name: "Dr. Helena Barrett",
    role: "Editor-in-Chief",
    bio: "Health systems researcher focused on translational evidence and publication ethics.",
    image: "/editorial/images/board-01.jpg"
  },
  {
    name: "Dr. Mateo Alvarez",
    role: "Deputy Editor, Engineering",
    bio: "Leads cross‑disciplinary reviews in energy and infrastructure innovation.",
    image: "/editorial/images/board-02.jpg"
  },
  {
    name: "Dr. Priya Natarajan",
    role: "Associate Editor, AI",
    bio: "Specializes in responsible machine learning and applied analytics.",
    image: "/editorial/images/board-03.jpg"
  },
  {
    name: "Dr. Samuel Okoro",
    role: "Associate Editor, Medicine",
    bio: "Clinician‑scientist focused on global health delivery and diagnostics.",
    image: "/editorial/images/board-04.jpg"
  },
  {
    name: "Dr. Elise Morgan",
    role: "Associate Editor, Energy",
    bio: "Renewable energy researcher with industry‑scale deployment experience.",
    image: "/editorial/images/board-05.jpg"
  },
  {
    name: "Dr. Adrian Wu",
    role: "Associate Editor, Robotics",
    bio: "Works on autonomous systems and human‑robot collaboration.",
    image: "/editorial/images/board-06.jpg"
  },
  {
    name: "Dr. Leila Haddad",
    role: "Associate Editor, Policy",
    bio: "Studies evidence‑based policy design and public impact evaluation.",
    image: "/editorial/images/board-07.jpg"
  },
  {
    name: "Dr. Marcus Bell",
    role: "Managing Editor",
    bio: "Oversees peer review workflow and production standards.",
    image: "/editorial/images/board-08.jpg"
  },
  {
    name: "Dr. Sofia Grant",
    role: "Ethics Editor",
    bio: "Focus on research integrity, consent, and data‑use compliance.",
    image: "/editorial/images/board-09.jpg"
  },
  {
    name: "Dr. Tessa Kline",
    role: "Statistical Editor",
    bio: "Ensures methodological rigor and reproducibility across submissions.",
    image: "/editorial/images/board-10.jpg"
  }
];

export default function EditorialBoardPage() {
  return (
    <>
      <section className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__kicker">Journal</div>
          <h1>Editorial Board</h1>
          <p>
            Dedicated editors ensuring rigorous, ethical, and high‑impact publication.
          </p>
          <div className="page-meta">
            <span>Peer‑Reviewed</span>
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
                <p className="editorial-card__bio">{member.bio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
