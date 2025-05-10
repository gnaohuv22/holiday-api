/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Kích hoạt dark mode với class
  theme: {
    extend: {
      colors: {
        // Bạn có thể thêm màu sắc tùy chỉnh ở đây
      },
    },
  },
  plugins: [],
}; 