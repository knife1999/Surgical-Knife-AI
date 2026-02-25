import { createApp } from "vue";
import TDesign from "tdesign-vue-next";
import "tdesign-vue-next/es/style/index.css";
import App from "./main-webview.vue";
import "./app.css";
import "./index.scss";

createApp(App).use(TDesign).mount("#app");
