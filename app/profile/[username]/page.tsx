import ProfileClient from "./ProfileClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  return <ProfileClient username={params.username} />;
}
