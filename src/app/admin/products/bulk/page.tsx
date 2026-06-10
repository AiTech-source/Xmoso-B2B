"use client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import BulkImporter from "@/components/admin/BulkImporter";

export default function BulkImportPage() {
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 flex-1 p-8">
        <h1 className="text-2xl font-light tracking-wider text-white mb-8">📤 Bulk Import</h1>
        <BulkImporter />
      </main>
    </div>
  );
}
