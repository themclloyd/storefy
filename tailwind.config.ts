import type { Config } from "tailwindcss";

export default {
	content: [
		"./src/**/*.{ts,tsx}",
	],
	theme: {
		extend: {
			// Tailwind 4 syntax updates
		}
	},
	plugins: []
} satisfies Config;
