import Link from "next/link";

export default function AdminPage() {
  return (
    <section>
      <header className="major">
        <h2>Admin</h2>
      </header>
      <p>The admin dashboard is coming soon.</p>
      <ul className="actions">
        <li>
          <Link href="/explore" className="button">
            Explore Articles
          </Link>
        </li>
        <li>
          <Link href="/" className="button-secondary">
            Home
          </Link>
        </li>
      </ul>
    </section>
  );
}
