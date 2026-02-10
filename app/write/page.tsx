import Link from "next/link";

export default function WritePage() {
  return (
    <section>
      <header className="major">
        <h2>Publish an Article</h2>
      </header>
      <p>The submission portal is coming soon. In the meantime, please email your manuscript to the editorial team.</p>
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
