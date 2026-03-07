"use client";

import { motion } from "framer-motion";

type Section = {
  title: string;
  content?: string[];
  list?: string[];
};

const sections: Section[] = [
  {
    title: "Nguồn gốc họ Phạm Đông Ngạc",
    content: [
      "Đông Ngạc (tên cổ Kẻ Vẽ) là một làng cổ ven sông Hồng nổi tiếng về truyền thống học hành, thường được gọi là 'làng khoa bảng' của vùng Thăng Long.",
      "Họ Phạm là một trong bốn dòng họ gốc của làng cùng với các họ Phan, Nguyễn và Đỗ.",
      "Dòng họ hình thành từ cuối thời Trần (thế kỷ XIV). Theo gia phả, thủy tổ được ghi là Phạm Húng (khoảng năm 1345).",
      "Theo các thư tịch Hán Nôm như 'Phạm tộc phả ký' và 'Phạm tộc gia phả', tổ tiên họ Phạm có nguồn gốc từ Ái Châu (Thanh Hóa).",
      "Do biến động lịch sử, ba anh em họ Phạm đã di cư ra Bắc và định cư tại nhiều nơi khác nhau.",
    ],
    list: [
      "Đôn Thư (Thanh Oai)",
      "Bát Tràng (Gia Lâm)",
      "Đông Ngạc (Từ Liêm)",
      "Trong đó, nhánh ở Đông Ngạc phát triển mạnh nhất và trở thành dòng họ khoa bảng nổi tiếng.",
    ],
  },
  {
    title: "Quy mô và cấu trúc dòng họ",
    content: [
      "Sau hơn 600 năm phát triển, họ Phạm Đông Ngạc đã hình thành một hệ thống gia tộc khá quy củ và bền vững.",
    ],
    list: [
      "Khoảng 22 đời con cháu",
      "Chia thành 16 chi (đại tôn)",
      "Thuộc hai hàng lớn: Giáp và Ất",
      "Có nhà thờ tổ và nhà thờ các chi",
      "Gia phả được duy trì và cập nhật định kỳ",
      "Con cháu tụ họp tế tổ vào ngày mùng 4 tháng Giêng hàng năm",
    ],
  },
  {
    title: "Truyền thống khoa bảng",
    content: [
      "Truyền thống học hành và khoa cử là một nét đặc sắc của họ Phạm Đông Ngạc.",
      "Trong thời kỳ khoa cử phong kiến, dòng họ có nhiều người đỗ đạt và tham gia phục vụ triều đình.",
    ],
    list: [
      "9 Tiến sĩ Nho học",
      "2 Sĩ vọng",
      "Khoảng 50 Hương cống / Cử nhân",
      "Trong làng Đông Ngạc có 22 tiến sĩ, riêng họ Phạm chiếm 9 người",
      "Trong số đó có 1 Bảng nhãn, 1 Hoàng giáp và 7 Đệ tam giáp tiến sĩ",
      "Tên các vị tiến sĩ được khắc trên bia đá tại Văn Miếu – Quốc Tử Giám và một phần tại Huế",
    ],
  },
];

const figures = [
  {
    name: "Phạm Lân Đính",
    desc: "Tiến sĩ thời Lê, từng làm quan triều đình. Ông hy sinh trong khi chống giặc bảo vệ đất nước và được ghi danh trên bia đá Văn Miếu.",
  },
  {
    name: "Phạm Thọ Lý (1610–1685)",
    desc: "Quan triều Lê, có nhiều đóng góp cho địa phương và được thờ làm Hậu thần tại đình Đông Ngạc.",
  },
  {
    name: "Phạm Quang Dung (1675–1739)",
    desc: "Quan triều Lê, có nhiều đóng góp cho triều đình và cho làng xã.",
  },
  {
    name: "Phạm Quang Trạch",
    desc: "Bảng nhãn nổi tiếng hiếu học. Tương truyền khi học ông đặt khăn ướt lên đùi để tránh ngủ gật.",
  },
];

export default function Introduction() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-center"
      >
        Họ Phạm Đông Ngạc
      </motion.h1>

      {/* Opening */}
      <section className="bg-gray-50 border rounded-2xl p-6 space-y-4">
        <p>
          Trải qua nhiều thế kỷ, dòng họ Phạm tại làng Đông Ngạc đã góp phần
          hình thành nên một truyền thống hiếu học và khoa bảng đáng trân trọng
          của vùng Thăng Long. Những tư liệu còn lưu giữ trong gia phả, bia đá
          và ký ức của các thế hệ cho thấy một lịch sử lâu dài gắn liền với sự
          học hành, phụng sự xã hội và gìn giữ gia phong.
        </p>

        <p>
          Những ghi chép dưới đây chỉ nhằm giới thiệu một cách khái quát về
          nguồn gốc, sự phát triển và truyền thống của dòng họ Phạm Đông Ngạc
          qua các thời kỳ lịch sử.
        </p>
      </section>

      {/* Sections */}
      {sections.map((section, index) => (
        <motion.section
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white shadow rounded-2xl p-6 space-y-4"
        >
          <h2 className="text-2xl font-semibold">{section.title}</h2>

          {section.content?.map((p, i) => (
            <p key={i} className="text-gray-700 leading-relaxed">
              {p}
            </p>
          ))}

          {section.list && (
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              {section.list.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </motion.section>
      ))}

      {/* Figures */}
      <section className="bg-white shadow rounded-2xl p-6 space-y-6">
        <h2 className="text-2xl font-semibold">Một số nhân vật tiêu biểu</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {figures.map((f, i) => (
            <div key={i} className="border rounded-lg p-4 hover:bg-gray-50 transition">
              <h3 className="font-semibold">{f.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Culture */}
      <section className="bg-white shadow rounded-2xl p-6 space-y-4">
        <h2 className="text-2xl font-semibold">Văn hóa và gia phong</h2>

        <p>
          Đông Ngạc từ lâu nổi tiếng với truyền thống hiếu học. Người xưa nói
          rằng vào ban đêm trong làng luôn vang lên tiếng học bài râm ran như
          “ếch kêu”, vì vậy làng còn có tên cổ là Đống Ếch.
        </p>

        <ul className="list-disc pl-6 space-y-1">
          <li>Nghèo nhưng trọng học</li>
          <li>Làm quan nhưng giữ thanh liêm</li>
          <li>Đề cao đạo đức gia đình</li>
        </ul>

        <p>
          Trong các dịp họp họ, những người học giỏi hoặc có đóng góp cho xã hội
          thường được ghi nhận trong gia phả và vinh danh trước họ tộc. Đây là
          một hình thức khuyến học truyền thống được duy trì qua nhiều thế hệ.
        </p>
      </section>

      {/* Role */}
      <section className="bg-white shadow rounded-2xl p-6 space-y-4">
        <h2 className="text-2xl font-semibold">Vị trí trong lịch sử Đông Ngạc</h2>

        <p>
          Làng Đông Ngạc được xem là một trong những làng khoa bảng nổi tiếng
          của Việt Nam.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Dòng họ</th>
                <th className="p-2 border">Vai trò</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">Phạm</td>
                <td className="border p-2">Nhiều tiến sĩ nhất</td>
              </tr>
              <tr>
                <td className="border p-2">Phan</td>
                <td className="border p-2">Nhiều danh nhân</td>
              </tr>
              <tr>
                <td className="border p-2">Nguyễn</td>
                <td className="border p-2">Nhiều quan lại</td>
              </tr>
              <tr>
                <td className="border p-2">Đỗ</td>
                <td className="border p-2">Truyền thống học hành</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Modern */}
      <section className="bg-white shadow rounded-2xl p-6 space-y-4">
        <h2 className="text-2xl font-semibold">Họ Phạm Đông Ngạc ngày nay</h2>

        <ul className="list-disc pl-6 space-y-1">
          <li>Con cháu sinh sống tại nhiều nơi trong và ngoài nước</li>
          <li>Vẫn duy trì tổ chức gia tộc và các hoạt động họp họ</li>
          <li>Nhà thờ tổ và các nhà thờ chi được gìn giữ</li>
          <li>Các hoạt động khuyến học tiếp tục được duy trì</li>
        </ul>

        <p>
          Một số nhân vật hiện đại tiêu biểu có gốc họ Phạm Đông Ngạc như
          Phạm Gia Khiêm – nguyên Phó Thủ tướng Việt Nam.
        </p>
      </section>

      {/* Purpose */}
      <section className="bg-gray-50 border rounded-2xl p-6 space-y-4">
        <h2 className="text-2xl font-semibold">Về việc xây dựng hệ thống phả hệ</h2>

        <p>
          Hệ thống phả hệ này được xây dựng với mong muốn góp phần lưu giữ và
          hệ thống hóa những tư liệu cơ bản về dòng họ Phạm Đông Ngạc. Qua
          nhiều thế hệ, gia phả và ký ức về tổ tiên đã được gìn giữ bằng nhiều
          hình thức khác nhau, nhưng theo thời gian một phần thông tin có thể
          bị phân tán hoặc mai một.
        </p>

        <p>
          Việc số hóa và tổ chức lại các dữ liệu phả hệ chỉ là một nỗ lực nhỏ
          nhằm giúp con cháu có thêm một phương tiện thuận tiện để tìm hiểu
          về nguồn cội, về các thế hệ đi trước cũng như mối liên hệ giữa các
          chi họ trong đại tộc.
        </p>

        <p>
          Hệ thống này không nhằm thay thế gia phả truyền thống, mà chỉ đóng
          vai trò như một phương tiện hỗ trợ cho việc lưu trữ, tra cứu và bổ
          sung thông tin theo thời gian. Mọi ý kiến đóng góp và chỉnh lý của
          các bậc trưởng thượng và con cháu trong dòng họ đều hết sức quý
          báu để hệ thống ngày càng đầy đủ và chính xác hơn.
        </p>

        <p className="italic text-center mt-4">
          “Ẩm thủy tư nguyên – Uống nước nhớ nguồn.”
        </p>
      </section>

    </div>
  );
}