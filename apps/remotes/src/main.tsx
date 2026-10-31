import { createRoot } from "react-dom/client";
import "./styles.css";
import "./standalone.css";
import { ThrottleDemo } from "./demos/throttle-demo";

/** 리모트를 혼자 띄워 볼 때 쓰는 페이지. 호스트 없이 데모가 그려지는지만 본다. */
createRoot(document.getElementById("root")!).render(
  <main className="mx-auto max-w-2xl p-8">
    <h1 className="mb-6 text-lg font-semibold">remotes — standalone</h1>
    <ThrottleDemo />
  </main>,
);
