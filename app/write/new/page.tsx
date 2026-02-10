import Link from "next/link";

export default function WriteNewPage() {
  return (
    <section>
      <header className="major">
        <h2>New Submission</h2>
      </header>
      <p>The online editor is coming soon. Please email your manuscript to the editorial team.</p>
      <ul className="actions">
        <li>
          <Link href="/explore" className="button">
            Explore Articles
          </Link>
        </li>
        <li>
          <Link href="/submit" className="button-secondary">
            Submission Guidelines
          </Link>
        </li>
      </ul>
    </section>
  );
}
