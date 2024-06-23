import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import { useBaseUrlUtils } from "@docusaurus/useBaseUrl";
import ThemedImage from "@theme/ThemedImage";
import type { Props } from "@theme/Footer/Logo";

import styles from "./styles.module.css";

function LogoImage({ logo }: Props) {
    const { withBaseUrl } = useBaseUrlUtils();
    const sources = {
        light: withBaseUrl(logo.src),
        dark: withBaseUrl(logo.srcDark ?? logo.src),
    };
    return (
        <ThemedImage
            alt={logo.alt}
            sources={sources}
            width={logo.width}
            height={logo.height}
        />
    );
}

export default function FooterLogo({ logo }: Props): JSX.Element {
    return logo.href ? (
        <Link
            href={logo.href}
            target={logo.target}
        >
            <LogoImage logo={logo} />
        </Link>
    ) : (
        <LogoImage logo={logo} />
    );
}
