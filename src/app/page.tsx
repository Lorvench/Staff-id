import { redirect } from "next/navigation";

// The app starts at the Login screen.
export default function HomePage() {
  redirect("/login");
}
