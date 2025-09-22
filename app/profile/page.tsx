import { redirect } from "next/navigation";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = "force-dynamic"


export default function ProfileRedirectPage() {
  redirect("/dashboard");
}


