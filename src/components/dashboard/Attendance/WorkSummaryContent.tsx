"use client";

import DOMPurify from "isomorphic-dompurify";

type WorkSummaryContentProps = {
  content: string;
};

export function WorkSummaryContent({ content }: WorkSummaryContentProps) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      "p",
      "strong",
      "em",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "br",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });

  return (
    <div
      className="
        text-sm leading-relaxed text-foreground
        [&_p]:my-1
        [&_p:first-child]:mt-0
        [&_p:last-child]:mb-0
        [&_ul]:my-2
        [&_ul]:list-disc
        [&_ul]:pl-5
        [&_ol]:my-2
        [&_ol]:list-decimal
        [&_ol]:pl-5
        [&_li]:my-0.5
        [&_blockquote]:my-2
        [&_blockquote]:border-l-2
        [&_blockquote]:pl-3
        [&_blockquote]:text-muted-foreground
        [&_strong]:font-semibold
        [&_a]:text-primary
        [&_a]:underline
      "
      dangerouslySetInnerHTML={{
        __html: sanitizedContent,
      }}
    />
  );
}
