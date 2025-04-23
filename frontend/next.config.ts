import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
    	// Warning: This allows production builds to successfully complete even if
   	// your project has ESLint errors.
    	ignoreDuringBuilds: true,
    },

	typescript: {
		// !! WARN !!
		// Dangerously allow production builds to successfully complete even if
		// your project has type errors.
		// YES!!!!!!!!!!!!!!!!!!! YES  YES YES!!!!!
		// !! WARN !!
		ignoreBuildErrors: true,
	},
	output: 'export',
	distDir: 'dist',
};

export default nextConfig;
