import { siteConfig } from "~/lib/site";

const gameId = `${siteConfig.url}/#game`;
const websiteId = `${siteConfig.url}/#website`;

const gameEntity = {
  "@type": "VideoGame",
  "@id": gameId,
  name: siteConfig.name,
  alternateName: siteConfig.plainName,
  url: siteConfig.url,
  description: siteConfig.description,
  applicationCategory: "Game",
  genre: ["Abstract strategy game", "Board game"],
  gamePlatform: "Web browser",
  operatingSystem: "Any",
  playMode: "MultiPlayer",
  numberOfPlayers: {
    "@type": "QuantitativeValue",
    minValue: 2,
    maxValue: 2,
  },
  inLanguage: siteConfig.language,
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: 0,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  sameAs: siteConfig.sameAs,
};

const websiteEntity = {
  "@type": "WebSite",
  "@id": websiteId,
  name: siteConfig.name,
  alternateName: siteConfig.plainName,
  url: siteConfig.url,
  description: siteConfig.description,
  inLanguage: siteConfig.language,
};

export const homeFaq = [
  {
    question: "What is SE!ZE?",
    answer:
      "SE!ZE is a two-player abstract strategy board game. Players move and capture pieces while competing to control the four marked center spaces, capture both opposing bosses, or reduce the opposing force to two pieces.",
  },
  {
    question: "Can I play SE!ZE online for free?",
    answer:
      "Yes. SE!ZE is free to play in a web browser. Create a private table, share the invite link with one friend, and start without creating an account.",
  },
  {
    question: "How many people can play SE!ZE?",
    answer:
      "SE!ZE is designed for exactly two players. Each player starts with six guards and two bosses.",
  },
  {
    question: "How do you win a game of SE!ZE?",
    answer:
      "Win by occupying all four marked center spaces, capturing both opposing bosses, or reducing the opponent to two remaining pieces.",
  },
] as const;

export const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    websiteEntity,
    gameEntity,
    {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/#webpage`,
      url: siteConfig.url,
      name: siteConfig.title,
      description: siteConfig.description,
      isPartOf: { "@id": websiteId },
      mainEntity: { "@id": gameId },
      inLanguage: siteConfig.language,
      dateModified: siteConfig.contentLastModified,
    },
    {
      "@type": "FAQPage",
      "@id": `${siteConfig.url}/#faq`,
      url: `${siteConfig.url}/#questions`,
      mainEntity: homeFaq.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    },
  ],
};

export const rulesStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    websiteEntity,
    gameEntity,
    {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/rules/#webpage`,
      url: `${siteConfig.url}/rules`,
      name: "How to play SE!ZE",
      description:
        "SE!ZE rules for setup, guard and boss movement, captures, power spaces, and all three ways to win.",
      isPartOf: { "@id": websiteId },
      about: { "@id": gameId },
      inLanguage: siteConfig.language,
      dateModified: siteConfig.contentLastModified,
      breadcrumb: { "@id": `${siteConfig.url}/rules/#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${siteConfig.url}/rules/#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Play SE!ZE",
          item: siteConfig.url,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Rules",
          item: `${siteConfig.url}/rules`,
        },
      ],
    },
  ],
};

export const strategyStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    websiteEntity,
    gameEntity,
    {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/strategy/#webpage`,
      url: `${siteConfig.url}/strategy`,
      name: "SE!ZE strategy guide",
      description:
        "Practical SE!ZE strategy for center control, sandwich captures, boss safety, power pieces, and planning around all three victory paths.",
      isPartOf: { "@id": websiteId },
      about: { "@id": gameId },
      inLanguage: siteConfig.language,
      dateModified: siteConfig.contentLastModified,
      breadcrumb: { "@id": `${siteConfig.url}/strategy/#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${siteConfig.url}/strategy/#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Play SE!ZE",
          item: siteConfig.url,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Strategy guide",
          item: `${siteConfig.url}/strategy`,
        },
      ],
    },
  ],
};
