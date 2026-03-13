"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Home,
  User,
  Search,
  Filter,
  Edit2,
  Save,
  X,
  Check,
} from "lucide-react";

export interface BranchRow {
  id: number;
  name: string;
  code: string | null;
  parent_id: number | null;
  description: string | null;
  created_at: string | null;
  founder: string | null;
  church: string | null;
}

export default function BranchesTable() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForms, setEditForms] = useState<{
    [key: number]: Partial<BranchRow>;
  }>({});
  const [saving, setSaving] = useState<{ [key: number]: boolean }>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newBranchForm, setNewBranchForm] = useState<Partial<BranchRow>>({
    id: 0,
    name: "",
    code: "",
    parent_id: null,
    description: "",
    founder: "",
    church: "",
  });
  const [savingNew, setSavingNew] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from("branches")
        .select(
          "id, name, code, parent_id, description, created_at, founder, church",
        )
        .order("code", { ascending: true, nullsFirst: true });

      if (!error && data) {
        setBranches(data as BranchRow[]);
      }
      setLoading(false);
    };

    // Check if user is admin (you can implement proper auth check here)
    const checkAdmin = async () => {
      // Use proper auth check like MemberDetailModal
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const adminStatus = profile?.role === "admin";
        console.log(
          "User:",
          user.email,
          "Role:",
          profile?.role,
          "Admin status:",
          adminStatus,
        );
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      }
    };

    fetchBranches();
    checkAdmin();
  }, []);

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.founder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.church?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (branch: BranchRow) => {
    setEditingId(branch.id);
    setEditForms((prev) => ({
      ...prev,
      [branch.id]: {
        name: branch.name,
        code: branch.code,
        description: branch.description,
        founder: branch.founder,
        church: branch.church,
      },
    }));
  };

  const handleSave = async (branchId: number) => {
    setSaving((prev) => ({ ...prev, [branchId]: true }));

    const editForm = editForms[branchId];
    const { error } = await supabase
      .from("branches")
      .update({
        name: editForm.name,
        code: editForm.code,
        description: editForm.description,
        founder: editForm.founder,
        church: editForm.church,
      })
      .eq("id", branchId);

    if (!error) {
      // Update local state
      setBranches(
        branches.map((branch) =>
          branch.id === branchId ? { ...branch, ...editForm } : branch,
        ),
      );
      setEditingId(null);
      // Remove edit form after successful save
      setEditForms((prev) => {
        const newForms = { ...prev };
        delete newForms[branchId];
        return newForms;
      });
    }

    setSaving((prev) => ({ ...prev, [branchId]: false }));
  };

  const handleCancel = (branchId: number) => {
    setEditingId(null);
    // Remove edit form
    setEditForms((prev) => {
      const newForms = { ...prev };
      delete newForms[branchId];
      return newForms;
    });
  };

  const handleInputChange = (
    branchId: number,
    field: keyof BranchRow,
    value: string,
  ) => {
    setEditForms((prev) => ({
      ...prev,
      [branchId]: {
        ...prev[branchId],
        [field]: value || null,
      },
    }));
  };

  const handleNewBranchChange = (
    field: keyof BranchRow,
    value: string | number | null,
  ) => {
    setNewBranchForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddNewBranch = async () => {
    if (!newBranchForm.name?.trim()) {
      alert("Vui lòng nhập tên chi họ!");
      return;
    }

    if (!newBranchForm.id || newBranchForm.id <= 0) {
      alert("Vui lòng nhập ID chi họ!");
      return;
    }

    setSavingNew(true);
    try {
      const { data, error } = await supabase
        .from("branches")
        .insert({
          id: newBranchForm.id,
          name: newBranchForm.name.trim(),
          code: newBranchForm.code?.trim() || null,
          parent_id: newBranchForm.parent_id || null,
          description: newBranchForm.description?.trim() || null,
          founder: newBranchForm.founder?.trim() || null,
          church: newBranchForm.church?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Inserted branch:", data);

      // Add to local state with proper type checking
      if (data && typeof data === "object" && "id" in data) {
        setBranches((prev) => [...prev, data as BranchRow]);
      } else {
        console.error("Invalid data structure returned:", data);
        throw new Error("Invalid data returned from database");
      }

      // Reset form
      setNewBranchForm({
        id: 0,
        name: "",
        code: "",
        parent_id: null,
        description: "",
        founder: "",
        church: "",
      });
      setIsAddingNew(false);
    } catch (error) {
      console.error("Error adding branch:", error);
      alert("Không thể thêm chi họ mới! Lỗi: " + (error as Error).message);
    } finally {
      setSavingNew(false);
    }
  };

  const handleDeleteBranch = async (branchId: number, branchName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa chi họ "${branchName}"?`)) {
      return;
    }

    setDeletingId(branchId);
    try {
      // Check if branch has children
      const { data: childrenBranches } = await supabase
        .from("branches")
        .select("id, name")
        .eq("parent_id", branchId);

      if (childrenBranches && childrenBranches.length > 0) {
        const childrenNames = childrenBranches.map((b) => b.name).join(", ");
        alert(
          `Không thể xóa chi họ này vì có các chi con: ${childrenNames}. Vui lòng xóa các chi con trước.`,
        );
        return;
      }

      // Check if branch has persons
      const { data: persons } = await supabase
        .from("persons")
        .select("id, full_name")
        .eq("branch_id", branchId)
        .limit(1);

      if (persons && persons.length > 0) {
        alert(
          `Không thể xóa chi họ này vì có thành viên trong chi. Vui lòng chuyển thành viên sang chi khác trước.`,
        );
        return;
      }

      // Delete branch
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", branchId);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      // Remove from local state
      setBranches((prev) => prev.filter((branch) => branch.id !== branchId));

      alert(`Đã xóa chi họ "${branchName}" thành công!`);
    } catch (error) {
      console.error("Error deleting branch:", error);
      alert("Không thể xóa chi họ! Lỗi: " + (error as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">
            Đang tải danh sách chi họ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Search Bar */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm chi họ, mã chi, người sáng lập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Bộ lọc</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Thêm Chi Họ</span>
            </button>
          )}
        </div>
      </div>

      {/* Add New Branch Form */}
      {isAddingNew && (
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">
              Thêm Chi Họ Mới
            </h3>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewBranchForm({
                  id: 0,
                  name: "",
                  code: "",
                  parent_id: null,
                  description: "",
                  founder: "",
                  church: "",
                });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Chi Họ *
              </label>
              <input
                type="number"
                value={newBranchForm.id || ""}
                onChange={(e) =>
                  handleNewBranchChange(
                    "id",
                    e.target.value ? Number(e.target.value) : 0,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập ID chi họ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên chi họ *
              </label>
              <input
                type="text"
                value={newBranchForm.name || ""}
                onChange={(e) => handleNewBranchChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên chi họ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã chi
              </label>
              <input
                type="text"
                value={newBranchForm.code || ""}
                onChange={(e) => handleNewBranchChange("code", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mã chi (tuỳ chọn)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chi họ cha
              </label>
              <select
                value={newBranchForm.parent_id || ""}
                onChange={(e) =>
                  handleNewBranchChange(
                    "parent_id",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Không có</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} {branch.code && `(${branch.code})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người sáng lập
              </label>
              <input
                type="text"
                value={newBranchForm.founder || ""}
                onChange={(e) =>
                  handleNewBranchChange("founder", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên người sáng lập..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhà thờ họ
              </label>
              <input
                type="text"
                value={newBranchForm.church || ""}
                onChange={(e) =>
                  handleNewBranchChange("church", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập tên nhà thờ họ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <input
                type="text"
                value={newBranchForm.description || ""}
                onChange={(e) =>
                  handleNewBranchChange("description", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mô tả..."
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddNewBranch}
              disabled={
                savingNew ||
                !newBranchForm.name?.trim() ||
                !newBranchForm.id ||
                newBranchForm.id <= 0
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {savingNew ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewBranchForm({
                  id: 0,
                  name: "",
                  code: "",
                  parent_id: null,
                  description: "",
                  founder: "",
                  church: "",
                });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Mã chi
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tên chi họ
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Người sáng lập
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Nhà thờ họ
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Mô tả
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBranches.map((branch) => {
              const isEditing = editingId === branch.id;
              const editForm = editForms[branch.id] || {};

              return (
                <tr
                  key={branch.id}
                  className={
                    isEditing
                      ? "bg-amber-50"
                      : "hover:bg-gray-50 transition-colors"
                  }
                >
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.code || ""}
                        onChange={(e) =>
                          handleInputChange(branch.id, "code", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm"
                        placeholder="Mã chi"
                      />
                    ) : (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-semibold text-sm">
                            {branch.code ? branch.code.slice(-2) : "N/A"}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {branch.code || "—"}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name || ""}
                        onChange={(e) =>
                          handleInputChange(branch.id, "name", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm"
                        placeholder="Tên chi họ"
                      />
                    ) : (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <Link
                          href={`/dashboard?view=members_filter&branch_id=${branch.id}`}
                          className="text-gray-900 font-medium hover:text-amber-700 hover:underline underline-offset-4 transition-colors"
                          title="Xem thành viên theo chi"
                        >
                          {branch.name}
                        </Link>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.founder || ""}
                        onChange={(e) =>
                          handleInputChange(
                            branch.id,
                            "founder",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm"
                        placeholder="Người sáng lập"
                      />
                    ) : (
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          {branch.founder || "—"}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.church || ""}
                        onChange={(e) =>
                          handleInputChange(branch.id, "church", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm"
                        placeholder="Nhà thờ họ"
                      />
                    ) : (
                      <div className="flex items-center">
                        <Home className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          {branch.church || "—"}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <textarea
                        value={editForm.description || ""}
                        onChange={(e) =>
                          handleInputChange(
                            branch.id,
                            "description",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm resize-none"
                        rows={2}
                        placeholder="Mô tả"
                      />
                    ) : (
                      <div className="max-w-xs">
                        <p
                          className="text-gray-600 truncate"
                          title={branch.description || undefined}
                        >
                          {branch.description || "—"}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSave(branch.id)}
                            disabled={saving[branch.id]}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 text-xs"
                          >
                            <Save className="w-3 h-3" />
                            {saving[branch.id] ? "Lưu..." : "Lưu"}
                          </button>
                          <button
                            onClick={() => handleCancel(branch.id)}
                            className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                            title="Hủy"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          {isAdmin && (
                            <button
                              onClick={() => handleEdit(branch)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Chỉnh sửa chi họ"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() =>
                                handleDeleteBranch(branch.id, branch.name)
                              }
                              disabled={deletingId === branch.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Xóa chi họ"
                            >
                              {deletingId === branch.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              )}
                            </button>
                          )}
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredBranches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Users className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">
                      {searchTerm
                        ? "Không tìm thấy chi họ phù hợp"
                        : "Chưa có dữ liệu chi họ"}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchTerm
                        ? "Thử tìm kiếm với từ khóa khác"
                        : "Hãy thêm chi họ đầu tiên"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredBranches.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hiển thị {filteredBranches.length} chi họ
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Trước
            </button>
            <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">
              1
            </span>
            <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
