import { auth } from "@/auth";
import moment from "moment";
import { permanentRedirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: { member_id: string }
}) {
  const session = await auth();
  if (session) {
    const user = session.user;
    if (user.role === "Member") {
      permanentRedirect(`/dashboard/${user.id}/${moment(new Date()).format("YYYY-MM-DD")}`);
    }
  }
  permanentRedirect(`/dashboard/${params.member_id}/${moment(new Date()).format("YYYY-MM-DD")}`);
}