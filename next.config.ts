import type { NextConfig } from "next";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {};

export default nextConfig;

// Faz o `next dev` enxergar os bindings do Cloudflare (o D1 local, entre eles),
// para que o ambiente de desenvolvimento seja o mesmo que o de produção.
initOpenNextCloudflareForDev();
