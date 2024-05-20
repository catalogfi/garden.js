import React, { useEffect } from "react";
import clsx from "clsx";
import type { Props } from "@theme/Footer/Layout";
import { useColorMode } from "@docusaurus/theme-common";
import ThemedImage from "@theme/ThemedImage";
import useBaseUrl from "@docusaurus/useBaseUrl";

type FooterProps = Props & {
    something: string;
};

export default function FooterLayout({
    style,
    links,
    logo,
    something,
}: FooterProps): JSX.Element {
    return (
        <footer
            className={
                clsx("footer", {
                    "footer--dark": style === "dark",
                }) + ` w-full relative py-0`
            }
        >
            <div
                className={
                    "absolute left-0 w-full h-[1px] shadow-[0_1px_2px_0px_rgba(0,0,0,0.1)] footer-partition-top"
                }
            ></div>
            <div className="flex flex-col gap-8 md:flex-row w-full py-16 justify-between sm:w-[35rem] md:w-[51rem] lg:w-[67rem] mx-auto">
                <div>{logo}</div>
                {links}
            </div>
            <div
                className={
                    "h-[2px] w-[21rem] sm:w-[35rem] md:w-[51rem] lg:w-[67rem] mx-auto footer-partition-bottom"
                }
            ></div>
            <div className="pt-4 mb-14 flex flex-col sm:flex-row gap-4 justify-between w-full sm:w-[35rem] md:w-[51rem] lg:w-[67rem] mx-auto">
                <div className="font-semibold flex flex-col items-start sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <div className="flex gap-2 items-center">
                        <span>Powered by </span>
                        <a
                            target="_blank"
                            href="https://www.catalog.fi/"
                            className="flex justify-start items-end text-center"
                        >
                            <ThemedImage
                                alt="Catalog"
                                sources={{
                                    light: useBaseUrl("/img/catalog.svg"),
                                    dark: useBaseUrl("/img/catalog-white.svg"),
                                }}
                            />
                        </a>
                    </div>
                </div>
                <div className="flex gap-4 font-medium items-center">
                    <a
                        target="_blank"
                        href="https://garden.finance/terms.pdf"
                        className="link"
                    >
                        Terms of Service
                    </a>
                    <a
                        target="_blank"
                        href="https://garden.finance/privacy.pdf"
                        className="link"
                    >
                        Privacy Policy
                    </a>
                </div>
            </div>
        </footer>
    );
}
