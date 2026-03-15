"use client";

import { useState, useEffect, useRef } from "react";
import { Person, Relationship } from "@/types";
import {
  Search,
  ChevronLeft,
  Download,
  Loader2,
  FileImage,
  FileText,
  Globe,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import PersonSelector from "@/components/PersonSelector";
import MemberDetailModal from "@/components/MemberDetailModal";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { DashboardProvider, useDashboard } from "@/components/DashboardContext";

// Simple export function for lineage
function LineageExportButton({
  persons,
  relationships,
  selectedPerson,
  lineageRef,
  lineage,
  getBranchName,
}: {
  persons: Person[];
  relationships: Relationship[];
  selectedPerson: Person | null;
  lineageRef: React.RefObject<HTMLDivElement | null>;
  lineage: Person[];
  getBranchName: (branchId: number | null) => string;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = async (format: "png" | "pdf" | "html") => {
    if (!lineageRef.current || !selectedPerson) return;

    setIsExporting(true);
    setShowMenu(false);

    try {
      if (format === "html") {
        // Simple HTML export
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Dòng dõi ${selectedPerson.full_name}</title>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f4; }
              .person { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: white; }
              .generation { background: #f0f0f0; padding: 5px 10px; border-radius: 4px; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Dòng dõi của ${selectedPerson.full_name}</h1>
            ${lineage
              .map(
                (person: Person) => `
              <div class="person">
                <div class="generation">Thế hệ ${person.generation || "N/A"}</div>
                <h2>${person.full_name}</h2>
                <p>Sinh năm: ${person.birth_year || "N/A"}</p>
                <p>Giới tính: ${person.gender === "female" ? "Nữ" : "Nam"}</p>
                ${person.branch_id ? `<p>Chi: ${getBranchName(person.branch_id)}</p>` : ""}
                ${person.other_names ? `<p>Tên khác: ${person.other_names}</p>` : ""}
              </div>
            `,
              )
              .join("")}
          </body>
          </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `lineage-${selectedPerson.full_name.replace(/\s+/g, "-")}.html`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Add a small delay to allow UI to update (close menu) before capturing
        await new Promise((resolve) => setTimeout(resolve, 100));

        const element = lineageRef.current;
        if (!element) throw new Error("Không tìm thấy vùng dữ liệu để xuất.");

        element.classList.add("exporting");

        const exportOptions = {
          cacheBust: true,
          backgroundColor: "#f5f5f4",
          pixelRatio: 2,
          width: element.scrollWidth,
          height: element.scrollHeight,
          style: {
            transform: "scale(1)",
            transformOrigin: "top left",
            width: `${element.scrollWidth}px`,
            height: `${element.scrollHeight}px`,
          },
        };

        if (format === "png") {
          const { toPng } = await import("html-to-image");
          const url = await toPng(element, exportOptions);
          const a = document.createElement("a");
          a.href = url;
          a.download = `lineage-${selectedPerson.full_name.replace(/\s+/g, "-")}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else if (format === "pdf") {
          const { toJpeg } = await import("html-to-image");
          const { default: jsPDF } = await import("jspdf");

          const imgData = await toJpeg(element, {
            ...exportOptions,
            quality: 0.95,
          });

          // Get the actual width and height of the element to calculate PDF dimensions
          const width = element.scrollWidth;
          const height = element.scrollHeight;

          const pdf = new jsPDF({
            orientation: width > height ? "landscape" : "portrait",
            unit: "px",
            format: [width, height],
          });
          pdf.addImage(imgData, "JPEG", 0, 0, width, height);
          pdf.save(
            `lineage-${selectedPerson.full_name.replace(/\s+/g, "-")}.pdf`,
          );
        }

        element.classList.remove("exporting");
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Export
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
          >
            <button
              onClick={() => handleExport("png")}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <FileImage className="w-4 h-4" />
              Export as PNG
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <FileText className="w-4 h-4" />
              Export as PDF
            </button>
            <button
              onClick={() => handleExport("html")}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <Globe className="w-4 h-4" />
              Export as HTML
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LineagePage() {
  return (
    <DashboardProvider>
      <LineagePageContent />
    </DashboardProvider>
  );
}

function LineagePageContent() {
  const { setMemberModalId } = useDashboard();
  const [persons, setPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [lineage, setLineage] = useState<Person[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const lineageRef = useRef<HTMLDivElement>(null);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Fetch persons
        const { data: personsData } = await supabase
          .from("persons")
          .select("*")
          .order("birth_year", { ascending: true, nullsFirst: false });

        // Fetch relationships
        const { data: relationshipsData } = await supabase
          .from("relationships")
          .select("*");

        // Fetch branches
        const { data: branchesData } = await supabase
          .from("branches")
          .select("id, name");

        setPersons(personsData || []);
        setRelationships(relationshipsData || []);
        setBranches(branchesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Find paternal lineage (cha → ông → cụ...)
  const findPaternalLineage = (personId: string): Person[] => {
    const lineage: Person[] = [];
    let currentId: string | null = personId;

    // Create persons map for quick lookup
    const personsMap = new Map(persons.map((p: Person) => [p.id, p]));

    while (currentId) {
      const currentPerson = personsMap.get(currentId);
      if (!currentPerson) break;

      lineage.push(currentPerson);

      // Find father of current person
      const fatherRelation = relationships.find(
        (r: Relationship) =>
          r.person_b === currentId && r.type === "biological_child",
      );

      currentId = fatherRelation?.person_a || null;
    }

    return lineage;
  };

  const handlePersonSelect = (id: string | null) => {
    if (!id) {
      setSelectedPerson(null);
      setLineage([]);
      return;
    }

    const person = persons.find((p: Person) => p.id === id);
    if (!person) return;

    setSelectedPerson(person);
    const lineageData = findPaternalLineage(person.id);
    setLineage(lineageData);
  };

  // Get branch name from branch_id
  const getBranchName = (branchId: number | null) => {
    if (!branchId) return "N/A";
    const branch = branches.find((b) => b.id === branchId);
    return branch?.name || "N/A";
  };

  // Handle person click - open MemberDetailModal
  const handlePersonClick = (personId: string) => {
    // Set member modal ID in context
    setMemberModalId(personId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Search className="w-6 h-6 text-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Truy Nguồn Gốc
                </h1>
                <p className="text-gray-600">
                  Tìm và hiển thị dòng dõi gia phả theo cha → ông → cụ...
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {selectedPerson && lineage.length > 0 && (
                <LineageExportButton
                  persons={persons}
                  relationships={relationships}
                  selectedPerson={selectedPerson}
                  lineageRef={lineageRef}
                  lineage={lineage}
                  getBranchName={getBranchName}
                />
              )}
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Quay về Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Person Selector Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Chọn người cần truy nguồn gốc
            </h2>
            <PersonSelector
              persons={persons}
              onSelect={handlePersonSelect}
              placeholder="Chọn người cần truy nguồn gốc..."
              label="Tìm người"
              className="w-full"
            />
          </div>
        </div>

        {/* Lineage Display Section */}
        {selectedPerson && lineage.length > 0 && (
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
            ref={lineageRef}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Dòng dõi của {selectedPerson.full_name}
              </h2>
              <p className="text-gray-600">
                Hiển thị đường dõi cha → ông → cụ... theo thứ tự từ gần đến xa
              </p>
            </div>
            <LineageDisplay
              lineage={lineage}
              getBranchName={getBranchName}
              onPersonClick={handlePersonClick}
            />
          </div>
        )}

        {/* Empty State */}
        {selectedPerson && lineage.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-500">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-medium mb-2">
                Không tìm thấy dòng dõi
              </p>
              <p className="text-gray-600">
                Không thể tìm thấy thông tin cha của {selectedPerson.full_name}
              </p>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!selectedPerson && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-500">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-medium mb-2">Chọn người để bắt đầu</p>
              <p className="text-gray-600">
                Sử dụng combobox ở trên để tìm và chọn người cần truy nguồn gốc
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Member Detail Modal */}
      <MemberDetailModal />
    </div>
  );
}

function LineageDisplay({
  lineage,
  getBranchName,
  onPersonClick,
}: {
  lineage: Person[];
  getBranchName: (branchId: number | null) => string;
  onPersonClick: (personId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {lineage.map((person, index) => (
        <div key={person.id} className="flex items-center">
          {/* Generation Number */}
          <div className="flex-shrink-0 w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-lg border-4 border-amber-200 shadow-lg">
            {index + 1}
          </div>

          {/* Arrow down for all except first */}
          {index > 0 && (
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
              <div className="w-1 h-8 bg-gray-400"></div>
              <div className="w-4 h-4 border-l-4 border-l-gray-400 border-t-4 border-t-transparent transform -translate-y-2"></div>
            </div>
          )}

          {/* Person Card - Clickable */}
          <button
            onClick={() => onPersonClick(person.id)}
            className="flex-1 bg-gradient-to-r from-white via-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-amber-400 hover:shadow-amber-100/50 text-left"
          >
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl ${
                  person.gender === "female"
                    ? "bg-gradient-to-br from-pink-400 to-pink-700"
                    : "bg-gradient-to-br from-blue-400 to-blue-700"
                }`}
              >
                {person.full_name.charAt(0)}
              </div>

              {/* Person Info */}
              <div className="flex-1">
                <div className="font-bold text-gray-900 text-3xl mb-4">
                  {person.full_name}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-base">
                  {person.birth_year && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">
                        Sinh năm:
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {person.birth_year}
                      </span>
                    </div>
                  )}
                  {person.generation && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">Thế hệ:</span>
                      <span className="text-gray-900 font-semibold">
                        {person.generation}
                      </span>
                    </div>
                  )}
                  {person.branch_id && (
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">Chi:</span>
                      <span className="text-gray-900 font-semibold">
                        {getBranchName(person.branch_id)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        person.gender === "female"
                          ? "bg-pink-500"
                          : "bg-blue-500"
                      }`}
                    ></div>
                    <span className="text-gray-700 font-medium">
                      Giới tính:
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {person.gender === "female" ? "Nữ" : "Nam"}
                    </span>
                  </div>
                </div>
                {person.other_names && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="text-sm text-amber-700 font-medium mb-2">
                      Tên khác:
                    </div>
                    <div className="text-base text-amber-900 font-medium">
                      {person.other_names}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}
