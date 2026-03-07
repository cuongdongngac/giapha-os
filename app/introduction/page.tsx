import Link from "next/link";
import Introduction from "@/components/Introduction";

export default function Page() {
  return (
    <div>
      <Link href="/dashboard">← Quay lại Dashboard</Link>

      <Introduction />
    </div>
  );
}