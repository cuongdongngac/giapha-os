import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest | any {
  return {
    name: "Họ Phạm Đông Ngạc",
    short_name: "HPĐN",
    description: "Ứng dụng gia phả họ Phạm Đông Ngạc",
    start_url: "/?source=pwa",
    id: "/?source=pwa",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#f59e0b",
    orientation: "portrait",
    lang: "vi",
    categories: ["lifestyle", "utilities"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512x512.png", 
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512", 
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-48x48.png",
        sizes: "48x48",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-36x36.png",
        sizes: "36x36",
        type: "image/png",
        purpose: "any"
      }
    ],
    shortcuts: [
      {
        name: "Xem gia phả",
        short_name: "Gia phả",
        description: "Mở trang gia phả",
        url: "/dashboard?view=list",
        icons: [
          {
            src: "/icons/icon-96x96.png",
            sizes: "96x96"
          }
        ]
      },
      {
        name: "Tìm thành viên",
        short_name: "Tìm kiếm",
        description: "Tìm kiếm thành viên",
        url: "/dashboard/members",
        icons: [
          {
            src: "/icons/icon-96x96.png",
            sizes: "96x96"
          }
        ]
      }
    ],
    screenshots: [
      {
        src: "/screenshots/desktop-1.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Trang chủ gia phả"
      },
      {
        src: "/screenshots/mobile-1.png",
        sizes: "375x667",
        type: "image/png", 
        form_factor: "narrow",
        label: "Danh sách thành viên"
      }
    ]
  }
}
