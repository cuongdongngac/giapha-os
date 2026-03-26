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
  Users,
  ChevronDown,
  ChevronRight,
  Sparkles,
  TreePine,
  Crown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import MemberDetailModal from "@/components/MemberDetailModal";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { DashboardProvider, useDashboard } from "@/components/DashboardContext";
import { useSearchParams, useRouter } from "next/navigation";

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

  const handleExport = async (format: "html" | "png" | "pdf") => {
    if (!selectedPerson) return;

    setIsExporting(true);
    try {
      switch (format) {
        case "html":
          const htmlContent = generateLineageHTML(
            selectedPerson,
            lineage,
            getBranchName,
          );
          downloadHTMLFile(
            htmlContent,
            `lineage-${selectedPerson.full_name}.html`,
          );
          break;
        case "png":
          if (lineageRef.current) {
            const { toPng } = await import("html-to-image");
            const dataUrl = await toPng(lineageRef.current, {
              quality: 0.95,
              pixelRatio: 2,
              backgroundColor: "#ffffff",
            });
            const link = document.createElement("a");
            link.download = `lineage-${selectedPerson.full_name}.png`;
            link.href = dataUrl;
            link.click();
          }
          break;
        case "pdf":
          if (lineageRef.current) {
            const { toPng } = await import("html-to-image");
            const jsPDF = await import("jspdf");
            const dataUrl = await toPng(lineageRef.current, {
              quality: 0.95,
              pixelRatio: 2,
              backgroundColor: "#ffffff",
            });
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
              const pdf = new jsPDF.jsPDF({
                orientation: "portrait",
                unit: "px",
                format: [img.width, img.height],
              });
              pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
              pdf.save(`lineage-${selectedPerson.full_name}.pdf`);
            };
          }
          break;
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const generateLineageHTML = (
    person: Person,
    lineage: Person[],
    getBranchName: (branchId: number | null) => string,
  ) => {
    // Function to get generation title based on index
    const getGenerationTitle = (index: number) => {
      const titles = [
        "Đời thứ cha mẹ",
        "Đời thứ ông bà",
        "Đời thứ cụ kỵ",
        "Đời thứ sơ kỵ",
        "Đời thứ cao kỵ",
        "Đời thứ tổ tiên thứ 6",
        "Đời thứ tổ tiên thứ 7",
        "Đời thứ tổ tiên thứ 8",
        "Đời thứ tổ tiên thứ 9",
        "Đời thứ tổ tiên thứ 10",
      ];
      return titles[index] || `Đời thứ tổ tiên thứ ${index + 1}`;
    };

    // Function to get relationship title based on index
    const getRelationshipTitle = (index: number) => {
      const relationships = [
        "Cha/Mẹ",
        "Ông/Bà",
        "Cụ/Kỵ",
        "Sơ kỵ",
        "Cao kỵ",
        "Tổ tiên thứ 6",
        "Tổ tiên thứ 7",
        "Tổ tiên thứ 8",
        "Tổ tiên thứ 9",
        "Tổ tiên thứ 10",
      ];
      return relationships[index] || `Tổ tiên thứ ${index + 1}`;
    };

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dòng dõi của ${person.full_name}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
        }
        .content {
            padding: 40px;
        }
        .person-card {
            background: linear-gradient(135deg, #ffffff 0%, #fef9c3 100%);
            border: 2px solid #f59e0b;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 20px rgba(245, 158, 11, 0.2);
            transition: transform 0.3s ease;
        }
        .person-card:hover {
            transform: translateY(-2px);
        }
        .person-name {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .person-details {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .detail-item {
            background: #f3f4f6;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.9rem;
            color: #374151;
        }
        .detail-item strong {
            color: #1f2937;
        }
        .generation-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 10px;
            display: inline-block;
        }
        .generation-info {
            background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 15px;
        }
        .generation-title {
            font-weight: 700;
            color: #d97706;
            font-size: 0.9rem;
            margin-bottom: 5px;
        }
        .person-with-title {
            font-weight: 600;
            color: #92400e;
            font-size: 1.1rem;
            margin-bottom: 3px;
        }
        .relationship-title {
            color: #b45309;
            font-size: 0.9rem;
        }
        .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 15px;
            z-index: 1000;
        }
        .controls button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            margin: 5px;
            cursor: pointer;
            font-weight: 500;
        }
        .controls button:hover {
            background: #2563eb;
        }
        @media print {
            .controls { display: none; }
            body { padding: 0; }
            .container { box-shadow: none; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌳 Dòng Dõi Gia Phả</h1>
            <h2>${person.full_name}</h2>
        </div>
        <div class="content">
            ${lineage
              .map(
                (ancestor, index) => `
                <div class="person-card">
                    <div class="generation-badge">${index + 1}</div>
                    <div class="generation-info">
                        <div class="generation-title">${getGenerationTitle(index)}</div>
                        <div class="person-with-title">${ancestor.gender === "female" ? "Bà " : "Ông "}${ancestor.full_name}</div>
                        <div class="relationship-title">${getRelationshipTitle(index)}</div>
                    </div>
                    <div class="person-name">${ancestor.full_name}</div>
                    <div class="person-details">
                        ${ancestor.birth_year ? `<div class="detail-item"><strong>Năm sinh:</strong> ${ancestor.birth_year}</div>` : ""}
                        ${ancestor.generation && ancestor.branch_id ? `<div class="detail-item"><strong>Chi:</strong> ${getBranchName(ancestor.branch_id)} - Đời: ${ancestor.generation}</div>` : ""}
                        ${ancestor.gender ? `<div class="detail-item"><strong>Giới tính:</strong> ${ancestor.gender === "male" ? "Nam" : "Nữ"}</div>` : ""}
                    </div>
                </div>
            `,
              )
              .join("")}
        </div>
    </div>
    <div class="controls">
        <button onclick="window.print()">🖨️ In</button>
        <button onclick="window.close()">✖️ Đóng</button>
    </div>
</body>
</html>`;
  };

  const downloadHTMLFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2 print:hidden" ref={menuRef}>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all shadow-md disabled:opacity-50 font-medium"
        >
          <Download className="w-4 h-4" />
          <span>Xuất file</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showMenu ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-100 z-50 py-1"
            >
              <button
                onClick={() => handleExport("html")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-amber-50 transition-colors text-stone-600 hover:text-amber-700"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">Xuất HTML</span>
              </button>
              <button
                onClick={() => handleExport("png")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-amber-50 transition-colors text-stone-600 hover:text-amber-700"
              >
                <FileImage className="w-4 h-4" />
                <span className="text-sm font-medium">Xuất PNG</span>
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-amber-50 transition-colors text-stone-600 hover:text-amber-700"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Xuất PDF</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LineagePageContent() {
  const { setMemberModalId } = useDashboard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const personId = searchParams.get("personId");
  const isFromModal = searchParams.get("source") === "modal";

  const [persons, setPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [lineage, setLineage] = useState<Person[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const lineageRef = useRef<HTMLDivElement>(null);

  const handleBack = () => {
    if (isFromModal) {
      window.close();
    } else {
      router.push("/dashboard");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Helper to fetch all records bypassing the 1000 limit
        async function fetchAll(
          table: string,
          columns: string,
          orderColumn?: string,
        ) {
          let allData: any[] = [];
          let page = 0;
          const pageSize = 1000;
          while (true) {
            let query = supabase
              .from(table)
              .select(columns)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            if (orderColumn) {
              query = query.order(orderColumn, {
                ascending: true,
                nullsFirst: false,
              });
            }
            const { data, error } = await query;
            if (error) {
              console.error(`Error fetching ${table}:`, error);
              break;
            }
            if (data && data.length > 0) {
              allData = [...allData, ...data];
              if (data.length < pageSize) break;
            } else {
              break;
            }
            page++;
          }
          return allData;
        }

        const personsData = await fetchAll("persons", "*", "birth_year");
        const relationshipsData = await fetchAll("relationships", "*");

        const { data: branchesData } = await supabase
          .from("branches")
          .select("id, name");

        setPersons(personsData || []);
        setRelationships(relationshipsData || []);
        setBranches(branchesData || []);

        if (personId) {
          const person = personsData?.find((p) => p.id === personId);
          if (person) {
            setSelectedPerson(person);
            setTimeout(() => {
              const lineageData = findPaternalLineage(
                person.id,
                personsData || [],
                relationshipsData || [],
              );
              setLineage(lineageData);
            }, 100);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [personId]);

  const findPaternalLineage = (
    personId: string,
    personsList: Person[],
    relationshipsList: Relationship[],
  ): Person[] => {
    const lineage: Person[] = [];
    let currentId: string | null = personId;

    const personsMap = new Map(personsList.map((p: Person) => [p.id, p]));

    while (currentId) {
      const fatherRelationship = relationshipsList.find(
        (rel) =>
          rel.person_b === currentId &&
          (rel.type === "biological_child" || rel.type === "adopted_child") &&
          personsMap.get(rel.person_a)?.gender === "male",
      );

      if (fatherRelationship) {
        const father = personsMap.get(fatherRelationship.person_a);
        if (father) {
          lineage.push(father);
          currentId = father.id;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return lineage;
  };

  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
    const lineageData = findPaternalLineage(person.id, persons, relationships);
    setLineage(lineageData);
  };

  const getBranchName = (branchId: number | null) => {
    if (!branchId) return "N/A";
    const branch = branches.find((b) => b.id === branchId);
    return branch?.name || "N/A";
  };

  const handlePersonClick = (personId: string) => {
    setMemberModalId(personId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-stone-600 text-lg">Đang tải dữ liệu gia phả...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-amber-50">
      <div className="bg-gradient-to-r from-stone-600 via-amber-600 to-stone-600 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30 shadow-lg">
                  <TreePine className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-white">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="text-2xl font-bold mb-1 flex items-center gap-2"
                >
                  Truy Vết Tổ Tiên
                  <Crown className="w-5 h-5 text-amber-200" />
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                  className="text-stone-100 text-sm"
                >
                  Khám phá dòng dõi gia phả ngược về các thế hệ trước
                </motion.p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {selectedPerson && lineage.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <LineageExportButton
                    persons={persons}
                    relationships={relationships}
                    selectedPerson={selectedPerson}
                    lineageRef={lineageRef}
                    lineage={lineage}
                    getBranchName={getBranchName}
                  />
                </motion.div>
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="print:hidden"
              >
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl transition-all duration-300 border border-white/30 shadow-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="font-medium">
                    {isFromModal ? "Đóng trang" : "Quay về Dashboard"}
                  </span>
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedPerson && lineage.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-200/60 p-10"
            ref={lineageRef}
          >
            <div className="mb-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl"
              >
                <Sparkles className="w-6 h-6" />
                <span className="text-xl font-bold">
                  Dòng Dõi của {selectedPerson.full_name}
                </span>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                className="text-stone-600 text-lg"
              >
                Hiển thị đường dõi cha → ông → cụ... theo thứ tự từ gần đến xa
              </motion.p>
            </div>
            <LineageDisplay
              lineage={lineage}
              getBranchName={getBranchName}
              onPersonClick={handlePersonClick}
            />
          </motion.div>
        )}

        {selectedPerson && lineage.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-amber-200/60 p-16 text-center"
          >
            <div className="max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-200 shadow-2xl"
              >
                <Search className="w-12 h-12 text-amber-600" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="text-2xl font-bold text-stone-900 mb-4"
              >
                Không Tìm Thấy Dòng Dõi
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="text-stone-600 text-lg leading-relaxed"
              >
                Không thể tìm thấy thông tin cha của{" "}
                <span className="font-semibold text-amber-600">
                  {selectedPerson.full_name}
                </span>
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                className="text-stone-500 mt-4 text-sm"
              >
                Người này có thể là thế hệ đầu tiên trong gia phả
              </motion.p>
            </div>
          </motion.div>
        )}

        {!selectedPerson && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-amber-200/60 p-16 text-center"
          >
            <div className="max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-200 shadow-2xl"
              >
                <Users className="w-12 h-12 text-amber-600" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="text-2xl font-bold text-stone-900 mb-4"
              >
                Bắt Đầu Truy Vết
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="text-stone-600 text-lg leading-relaxed mb-4"
              >
                Vui lòng chọn thành viên từ PersonCard để bắt đầu truy vết tổ
                tiên
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                className="flex items-center justify-center gap-2 text-amber-600"
              >
                <ChevronRight className="w-5 h-5" />
                <span className="font-medium">
                  Chọn người từ PersonCard để bắt đầu
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

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
  // Function to get generation title based on index
  const getGenerationTitle = (index: number) => {
    const titles = [
      "Đời thứ cha mẹ",
      "Đời thứ ông bà",
      "Đời thứ cụ kỵ",
      "Đời thứ sơ kỵ",
      "Đời thứ cao kỵ",
      "Đời thứ tổ tiên thứ 6",
      "Đời thứ tổ tiên thứ 7",
      "Đời thứ tổ tiên thứ 8",
      "Đời thứ tổ tiên thứ 9",
      "Đời thứ tổ tiên thứ 10",
    ];
    return titles[index] || `Đời thứ tổ tiên thứ ${index + 1}`;
  };

  // Function to get relationship title based on index
  const getRelationshipTitle = (index: number) => {
    const relationships = [
      "Cha/Mẹ",
      "Ông/Bà",
      "Cụ/Kỵ",
      "Sơ kỵ",
      "Cao kỵ",
      "Tổ tiên thứ 6",
      "Tổ tiên thứ 7",
      "Tổ tiên thứ 8",
      "Tổ tiên thứ 9",
      "Tổ tiên thứ 10",
    ];
    return relationships[index] || `Tổ tiên thứ ${index + 1}`;
  };

  return (
    <div className="space-y-4">
      {lineage.map((person, index) => (
        <motion.div
          key={person.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          className="flex items-stretch gap-4"
        >
          {/* Generation indicator */}
          <div className="flex flex-col items-center gap-1 w-10 shrink-0">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-sm shadow-sm">
              {index + 1}
            </div>
            {index < lineage.length - 1 && (
              <div className="w-0.5 grow bg-amber-100 rounded-full" />
            )}
          </div>

          {/* Card */}
          <button
            onClick={() => onPersonClick(person.id)}
            className="flex-1 text-left bg-white border border-stone-200 rounded-2xl p-4 hover:border-amber-400 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm ${
                  person.gender === "female" ? "bg-rose-400" : "bg-sky-400"
                }`}
              >
                {person.full_name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-stone-900 truncate group-hover:text-amber-700 transition-colors">
                    {person.full_name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full font-medium">
                    {getRelationshipTitle(index)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                  {person.birth_year && (
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-stone-300" />
                      Năm sinh:{" "}
                      <span className="font-semibold text-stone-700">
                        {person.birth_year}
                      </span>
                    </span>
                  )}
                  {person.generation && (
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-stone-300" />
                      Đời:{" "}
                      <span className="font-semibold text-stone-700">
                        {person.generation}
                      </span>
                    </span>
                  )}
                  {person.branch_id && (
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-stone-300" />
                      Chi:{" "}
                      <span className="font-semibold text-stone-700">
                        {getBranchName(person.branch_id)}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden sm:block text-right shrink-0">
                <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                  {getGenerationTitle(index)}
                </div>
                <div className="text-xs text-stone-400 italic">
                  {person.gender === "female" ? "Bà" : "Ông"}
                </div>
              </div>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  );
}

export default function LineageTracePage() {
  return (
    <DashboardProvider>
      <LineagePageContent />
    </DashboardProvider>
  );
}
