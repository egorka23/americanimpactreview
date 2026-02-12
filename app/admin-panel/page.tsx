import { headers } from "next/headers";
import AdminLocalClient from "./AdminLocalClient";

function isLocalHost(host: string) {
  const value = host.toLowerCase();
  return value.includes("localhost") || value.includes("127.0.0.1");
}

export default function AdminPanelPage() {
  const host = headers().get("host") || "";
  const localOnly = isLocalHost(host);

  if (!localOnly) {
    return (
      <section>
        <header className="major">
          <h2>Admin Panel</h2>
        </header>
        <p>This admin panel is available only on a local development machine.</p>
      </section>
    );
  }

  return <AdminLocalClient />;
}
