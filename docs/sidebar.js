function skipIndex(items) {
    return items.filter(({ type, id }) => {
        if (!id) return true;
        const [dir, file] = id.split("/").slice(-2);
        if (!dir || !file) return true;
        if (
            dir.toLowerCase() === file.toLowerCase() ||
            file.toLowerCase() === "index"
        )
            return false;
        return true;
    });
}

export async function sidebarItemsGenerator({
    defaultSidebarItemsGenerator,
    ...args
}) {
    const sidebarItems = await defaultSidebarItemsGenerator(args);
    return skipIndex(sidebarItems);
}
