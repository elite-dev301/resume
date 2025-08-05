import { auth } from "@/auth";
import { permanentRedirect } from "next/navigation";
import DashboardPage from "./DashboardPage";

export default async function Dashboard({
  params,
}: {
  params: { member_id: string, date: string }
}) {
  const {member_id, date} = params;

  const session = await auth();
  if (session) {
    const user = session.user;
    if (user.role === "Member") {
      if (user.id !== member_id)
        permanentRedirect(`/dashboard/${user.id}/${date}`);
    }

    return <DashboardPage member_id={member_id} date={date} isAdmin={user.role === "Admin"} />
  }
  
  permanentRedirect('/auth/signin');
}