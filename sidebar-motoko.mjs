export const motokoSidebar = {
  label: "Motoko",
  collapsed: true,
  items: [
    { slug: "languages/motoko" },
    {
      label: "Fundamentals",
      collapsed: true,
      autogenerate: { directory: "languages/motoko/fundamentals" },
    },
    {
      label: "ICP features",
      collapsed: true,
      autogenerate: { directory: "languages/motoko/icp-features" },
    },
    {
      label: "Reference",
      collapsed: true,
      autogenerate: { directory: "languages/motoko/reference" },
    },
  ],
};
