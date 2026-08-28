type JsonLdProps = {
  data: Record<string, unknown>;
  id: string;
};

export function JsonLd({ data, id }: JsonLdProps) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return (
    <script
      id={id}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON is serialized locally and escapes markup-opening characters above.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
