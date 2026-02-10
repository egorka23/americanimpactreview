import Link from "next/link";

export default function SettingsPage() {
  return (
    <section>
      <header className="major">
        <h2>Settings</h2>
      </header>
      <p>Account settings are coming soon.</p>
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
