import { redirect } from "next/navigation";

export default function Home() {
  // Landing routes to the teacher dashboard for now. Auth + role routing
  // (student / teacher / admin) lands here once the auth module exists.
  redirect("/dashboard");
}
