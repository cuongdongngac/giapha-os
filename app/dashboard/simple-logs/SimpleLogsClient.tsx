"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search, Filter, Calendar, User, Activity, Globe } from "lucide-react";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export default function SimpleLogsClient() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, [searchTerm]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100); // Limit to 100 for performance

      // Apply search filter
      if (searchTerm) {
        query = query.or(
          `action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%`,
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching logs:", error);
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-emerald-100 text-emerald-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
      login: "bg-green-100 text-green-800",
      logout: "bg-gray-100 text-gray-800",
      reset_password: "bg-amber-100 text-amber-800",
      change_password: "bg-purple-100 text-purple-800",
    };
    return colors[action] || "bg-stone-100 text-stone-800";
  };

  const getEntityTypeIcon = (entityType: string) => {
    const icons: Record<string, React.ReactNode> = {
      user: <User className="size-4" />,
      person: <User className="size-4" />,
      event: <Calendar className="size-4" />,
      system: <Activity className="size-4" />,
      lineage: <Globe className="size-4" />,
    };
    return icons[entityType] || <Activity className="size-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">
            Nhật Ký Hoạt Động
          </h1>
          <p className="text-stone-600">
            Theo dõi các hoạt động trong hệ thống (đơn giản)
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 size-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm hoạt động..."
                className="pl-10 pr-4 py-2 w-full border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Hành động
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Đối tượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      {new Date(log.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      {log.user_id
                        ? `User ID: ${log.user_id.slice(0, 8)}`
                        : "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      <div className="flex items-center gap-2">
                        {getEntityTypeIcon(log.entity_type)}
                        <span>{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="text-stone-400 text-xs">
                            #{log.entity_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-900">
                      {log.details ? (
                        <span className="text-stone-600 text-xs">
                          {log.details.length > 50
                            ? log.details.substring(0, 50) + "..."
                            : log.details}
                        </span>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
