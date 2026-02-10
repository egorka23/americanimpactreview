import Link from "next/link";

export default function SignupPage() {
  return (
    <section>
      <header className="major">
        <h2>Create account</h2>
      </header>
      <p>Author registration is coming soon.</p>
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
