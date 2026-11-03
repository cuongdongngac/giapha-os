import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import "./custom.css";

// Nút "← Về gia phả" trên thanh đầu trang (link tuyệt đối /dashboard, nằm ngoài base /help/).
// target="_self" để router VitePress không chặn cú bấm — nếu không nó tự gắn đuôi .html → /dashboard.html.
export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "nav-bar-content-after": () => h("a", { href: "/dashboard", target: "_self", class: "gp-back" }, "← Về gia phả"),
    });
  },
};
