import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { sidebarItemsGenerator } from "./sidebar";

const config: Config = {
    title: "Garden Docs",
    tagline: "Bringing bitcoin based assets to your dApp.",
    favicon: "img/flower.svg",

    // Set the production url of your site here
    url: "https://*.garden.finance",
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: "/",

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: "gardenfi", // Usually your GitHub org/user name.
    projectName: "garden docs", // Usually your repo name.

    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    plugins: [
        async function myPlugin(context, options) {
            return {
                name: "docusaurus-tailwindcss",
                configurePostCss(postcssOptions) {
                    // Appends TailwindCSS and AutoPrefixer.
                    postcssOptions.plugins.push(require("tailwindcss"));
                    postcssOptions.plugins.push(require("autoprefixer"));
                    return postcssOptions;
                },
            };
        },
    ],

    presets: [
        [
            "classic",
            {
                docs: {
                    routeBasePath: "/",
                    sidebarPath: "./sidebars.ts",
                    sidebarItemsGenerator: sidebarItemsGenerator,
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    //   editUrl:
                    //     'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
                },
                blog: false,
                theme: {
                    customCss: "./src/css/custom.css",
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        colorMode: {
            defaultMode: "light",
            disableSwitch: false,
            respectPrefersColorScheme: true,
        },
        image: "img/garden.svg",
        navbar: {
            logo: {
                alt: "Garden logo",
                src: "img/garden-docs.svg",
                srcDark: "img/garden-docs-white.svg",
            },
            items: [
                {
                    to: "/",
                    type: "doc",
                    position: "left",
                    docId: "home/get-started",
                    label: "Home",
                },
                {
                    to: "/developers",
                    type: "doc",
                    position: "left",
                    docId: "developers/developers",
                    label: "Developers",
                },
                {
                    to: "/cookbook",
                    type: "doc",
                    position: "left",
                    docId: "cookbook/cookbook",
                    label: "Cookbook",
                },
                {
                    to: "/community",
                    type: "doc",
                    position: "left",
                    docId: "community/community",
                    label: "Community",
                },
                {
                    href: "https://github.com/catalogfi/garden.js",
                    position: "right",
                    className: "header-link header-github-link",
                    "aria-label": "GitHub repository",
                },
                {
                    href: "https://twitter.com/intent/follow?screen_name=garden_finance",
                    position: "right",
                    className: "header-link header-twitter-link",
                    "aria-label": "Twitter Handle",
                },
                {
                    href: "https://discord.com/invite/Fp4ZmZZrFu",
                    position: "right",
                    className: "header-link header-discord-link",
                    "aria-label": "Discord Server",
                },
            ],
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
        footer: {
            logo: {
                alt: "Garden logo",
                src: "img/garden.svg",
                srcDark: "img/garden-white.svg",
            },
            links: [
                {
                    title: "Application",
                    items: [
                        {
                            label: "Swap",
                            to: "https://garden.finance/swap",
                        },
                        {
                            label: "Stake",
                            to: "https://garden.finance/stake",
                        },
                        {
                            label: "Leaderboard",
                            to: "https://garden.finance/leaderboard",
                        },
                    ],
                },
                {
                    title: "Resources",
                    items: [
                        {
                            label: "Blog",
                            to: "https://garden.finance/blog/",
                        },
                        {
                            label: "Audits",
                            to: "https://github.com/catalogfi/audits",
                        },
                    ],
                },
                {
                    title: "Ecosystem",
                    items: [
                        {
                            label: "Analytics",
                            to: "https://dune.com/garden_finance/gardenfinance",
                        },
                        {
                            label: "Explorer",
                            to: "https://main--symphonious-chaja-a69e12.netlify.app/",
                        },
                    ],
                },
                {
                    title: "Community",
                    items: [
                        {
                            label: "Discord",
                            to: "https://discord.com/invite/Fp4ZmZZrFu",
                        },
                        {
                            label: "Telegram",
                            to: "https://t.me/GardenTownhall",
                        },
                        {
                            label: "X",
                            to: "https://x.com/intent/follow?screen_name=garden_finance",
                        },
                    ],
                },
            ],
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
