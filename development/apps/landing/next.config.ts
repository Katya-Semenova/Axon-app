import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Автономная компактная сборка (server.js) для упаковки в Docker на слабом VPS (1 ГБ).
  output: "standalone",
  // Монорепо (Урок 6): общие node_modules и @axon/ui лежат уровнем выше — в development/.
  // Без этого standalone не дотягивает их в коробку. Корень трассировки = корень workspace.
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
