"use client";

import { useState, useEffect } from "react";
import { type BoardMember, slugify, leadership, members } from "./data";

function ShareButton({ member }: { member: BoardMember }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const slug = slugify(member.name);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/editorial-board/${slug}`
    : `https://americanimpactreview.com/editorial-board/${slug}`;
  const title = `${member.name} — ${member.role} at American Impact Review`;

  async function handleClick() {
    // Try native share (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or not supported — fall through to popup
      }
    }
    setOpen((v) => !v);
  }

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1500);
    });
  }

  // Close popup on outside click
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".eb-share-wrap")) setOpen(false);
    }
    document.addEventListener("click", onClickOutside, true);
    return () => document.removeEventListener("click", onClickOutside, true);
  }, [open]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const socials = [
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
    {
      name: "X",
      href: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#000">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="eb-share-wrap">
      <button
        onClick={handleClick}
        className="eb-share"
        aria-label={`Share ${member.name}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </button>

      {open && (
        <div className="eb-share-popup">
          <div className="eb-share-popup__title">Share profile</div>
          <div className="eb-share-popup__socials">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="eb-share-popup__item"
                onClick={() => setOpen(false)}
              >
                {s.icon}
                <span>{s.name}</span>
              </a>
            ))}
          </div>
          <button className="eb-share-popup__copy" onClick={handleCopy}>
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy link
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
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
    <div className="eb-leader" id={slugify(member.name)}>
      <ShareButton member={member} />
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
    <div className="eb-row" id={slugify(member.name)}>
      <ShareButton member={member} />
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
  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("eb-highlight");
          setTimeout(() => el.classList.remove("eb-highlight"), 2000);
        }, 300);
      }
    }
  }, []);

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
