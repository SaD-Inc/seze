import { siteConfig } from "~/lib/site";

export function ProjectDisclaimer({ tagline }: { tagline: string }) {
  return (
    <div className="max-w-2xl space-y-1.5 text-center sm:text-start">
      <p>{tagline}</p>
      <p className="leading-5 text-[#8f816e]">
        This unofficial web version of SE!ZE is not affiliated with or endorsed
        by its creators.
      </p>
      <p className="leading-5 text-[#8f816e]">
        Website created by{" "}
        <a
          className="text-[#bba477] underline decoration-[#bba477]/35 underline-offset-4 transition-colors hover:text-[#e1c98f]"
          href={siteConfig.websiteCreator.url}
          target="_blank"
          rel="noreferrer"
        >
          {siteConfig.websiteCreator.name}
        </a>
        .
      </p>
    </div>
  );
}
