"use client";

interface RichContentProps {
  content: any;
}

export default function RichContent({ content }: RichContentProps) {
  if (!content || !content.blocks) return null;

  return (
    <div className="prose prose-invert max-w-none">
      {content.blocks.map((block: any, i: number) => {
        switch (block.type) {
          case "text":
            return <p key={i} className="text-silver/70 leading-relaxed mb-4">{block.data}</p>;
          case "heading":
            return <h3 key={i} className="text-xl text-white tracking-wide mt-8 mb-4">{block.data}</h3>;
          case "image":
            if (!block.data?.url) return null;
            return (
              <div key={i} className="my-6">
                <img src={block.data.url} alt={block.data.alt || ""} className="rounded-xl w-full" />
                {block.data.caption && <p className="text-xs text-silver/50 mt-2 text-center">{block.data.caption}</p>}
              </div>
            );
          case "divider":
            return <hr key={i} className="border-silver/10 my-8" />;
          default:
            return <p key={i} className="text-silver/70 leading-relaxed">{block.data}</p>;
        }
      })}
    </div>
  );
}
