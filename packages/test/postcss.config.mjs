/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    'postcss-nesting': {},
    autoprefixer: {}
  },
};

export default config;
