import Link from "next/link";

export default function LoginPage() {
  return (
    <section>
      <header className="major">
        <h2>Log in</h2>
      </header>
      <p>Author accounts are coming soon.</p>
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
