import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		fontFamily: {
			sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
			'space-grotesk': ['Space Grotesk', 'system-ui', 'sans-serif'],
		},
		extend: {
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				chart: {
					"1": "hsl(var(--chart-1))",
					"2": "hsl(var(--chart-2))",
					"3": "hsl(var(--chart-3))",
					"4": "hsl(var(--chart-4))",
					"5": "hsl(var(--chart-5))",
				},
				// Professional color palette
				green: {
					50: "hsl(111, 69%, 95%)",
					100: "hsl(111, 69%, 88%)",
					200: "hsl(111, 69%, 78%)",
					300: "hsl(111, 69%, 65%)",
					400: "hsl(111, 69%, 51%)",
					500: "hsl(111, 69%, 38%)",  /* Primary #2CA01C */
					600: "hsl(111, 69%, 32%)",
					700: "hsl(111, 69%, 26%)",
					800: "hsl(111, 69%, 20%)",
					900: "hsl(111, 69%, 15%)",
				},
				blue: {
					50: "hsl(210, 100%, 97%)",
					100: "hsl(210, 100%, 94%)",
					200: "hsl(210, 100%, 87%)",
					300: "hsl(210, 100%, 78%)",
					400: "hsl(210, 100%, 66%)",
					500: "hsl(210, 100%, 50%)",
					600: "hsl(210, 100%, 45%)",
					700: "hsl(210, 100%, 39%)",
					800: "hsl(210, 100%, 32%)",
					900: "hsl(210, 100%, 24%)",
				},
				orange: {
					50: "hsl(25, 95%, 95%)",
					100: "hsl(25, 95%, 88%)",
					200: "hsl(25, 95%, 78%)",
					300: "hsl(25, 95%, 68%)",
					400: "hsl(25, 95%, 60%)",
					500: "hsl(25, 95%, 53%)",
					600: "hsl(25, 95%, 47%)",
					700: "hsl(25, 95%, 39%)",
					800: "hsl(25, 95%, 31%)",
					900: "hsl(25, 95%, 24%)",
				},
			},
			transitionTimingFunction: {
				'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
