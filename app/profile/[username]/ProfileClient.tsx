import Link from "next/link";

export default function ProfileClient({ username }: { username: string }) {
  return (
    <section>
      <header className="major">
        <h2>Profile: {username}</h2>
      </header>
      <p>Author profiles are coming soon.</p>
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
