import Link from "next/link";
import BranchesTable from "@/components/BranchesTable";

export default function BranchesPage() {
  return (
    <div>
      <Link href="/dashboard">← Quay lại Dashboard</Link>

      <BranchesTable />
    </div>
  );
}