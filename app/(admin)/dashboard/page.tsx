import moment from "moment";
import { permanentRedirect } from "next/navigation";

export default async function Page() {
  permanentRedirect(`/dashboard/all/${moment(new Date()).format("YYYY-MM-DD")}`);
}