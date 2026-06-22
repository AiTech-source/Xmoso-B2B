"use client";

interface Block {
  type: string;
  data: any;
  style?: Record<string, string>;
}

interface RichContentProps {
  content: { blocks?: Block[] } | null;
}

export default function RichContent({ content }: RichContentProps) {
  if (!content?.blocks?.length) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {content.blocks.map((block: Block, i: number) => {
        const s = block.style || {};

        switch (block.type) {
          case "heading":
            return (
              <h2 key={i}
                style={{
                  color: s.color || undefined,
                  fontSize: s.fontSize ? `${s.fontSize}px` : "28px",
                  fontWeight: s.fontWeight || "300",
                  textAlign: (s.textAlign as any) || undefined,
                }}
                className="tracking-wide"
              >
                {block.data}
              </h2>
            );

          case "text":
            return (
              <p key={i}
                style={{
                  color: s.color || undefined,
                  fontSize: s.fontSize ? `${s.fontSize}px` : "16px",
                  fontWeight: s.fontWeight || undefined,
                  textAlign: (s.textAlign as any) || undefined,
                }}
                className="leading-relaxed"
              >
                {block.data}
              </p>
            );

          case "image":
            if (!block.data?.url) return null;
            const imgMaxW = block.data.maxWidth || "100%";
            const imgMaxH = block.data.maxHeight || "auto";
            return (
              <div key={i} className="my-8" style={{ maxWidth: imgMaxW, margin: "32px auto" }}>
                <div className="relative rounded-xl overflow-hidden img-vignette" style={{
                  borderRadius: "12px",
                  maxHeight: imgMaxH,
                }}>
                  <img src={block.data.url} loading="lazy" alt={block.data.alt || ""} className="w-full" style={{ maxHeight: imgMaxH, display: "block" }} />
                  {block.data.overlay?.text && (
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8" style={{ background: "linear-gradient(transparent 0%, rgba(10,10,15,0.8) 100%)" }}>
                      <span style={{
                        fontSize: `${block.data.overlay.fontSize || 16}px`,
                        color: block.data.overlay.color || "#ffffff",
                        lineHeight: 1.4,
                        display: "block",
                      }}>
                        {block.data.overlay.text}
                      </span>
                    </div>
                  )}
                </div>
                {block.data.caption && (
                  <p className="text-xs text-silver/50 mt-3 text-center">{block.data.caption}</p>
                )}
              </div>
            );

          case "rich-html":
            if (!block.data?.html) return null;
            return (
              <div key={i} className="my-6 rich-text-display content-vignette"
                style={{
                  color: s.color || undefined,
                  fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
                  textAlign: (s.textAlign as any) || undefined,
                }}
                dangerouslySetInnerHTML={{ __html: block.data.html }}
              />
            );

          case "raw-html":
            if (!block.data?.html) return null;
            return (
              <div key={i} className="my-6"
                style={{
                  color: s.color || undefined,
                  fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
                  textAlign: (s.textAlign as any) || undefined,
                }}
                dangerouslySetInnerHTML={{ __html: block.data.html }}
              />
            );

          case "rich-text":
            if (!block.data) return null;
            const segments: { text: string; color?: string; fontSize?: string; fontWeight?: string }[] = block.data.segments || [];
            return (
              <div key={i} className="flex flex-col md:flex-row gap-6 md:gap-10 my-8 items-start">
                {block.data.image_url && (
                  <div className="md:w-2/5 w-full flex-shrink-0">
                    <img src={block.data.image_url} alt={block.data.image_alt || ""} className="w-full rounded-xl object-cover" style={{ maxHeight: "360px" }} />
                  </div>
                )}
                <div className={block.data.image_url ? "md:w-3/5 w-full" : "w-full"}>
                  {segments.map((seg: any, si: number) => (
                    <span key={si} style={{
                      color: seg.color || "rgba(192,192,192,0.7)",
                      fontSize: seg.fontSize ? `${seg.fontSize}px` : "16px",
                      fontWeight: seg.fontWeight || undefined,
                    }}>{seg.text}</span>
                  ))}
                </div>
              </div>
            );

          case "multirow": {
            const cols = block.data?.columns || 3;
            const items = block.data?.items || [];
            if (!items.length) return null;
            return (
              <div key={i} className="grid gap-6 my-10" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 4)}, 1fr)` }}>
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="p-6 bg-deep-blue/30 border border-silver/10 rounded-xl text-center hover:border-forest/30 transition-colors">
                    {item.image_url && <img src={item.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-4" />}
                    {item.icon && <div className="text-4xl mb-4" style={{ color: item.style?.color || undefined }}>{item.icon}</div>}
                    {item.title && (
                      <h3 className="text-lg text-white font-light tracking-wide mb-3" style={{ color: item.style?.color || undefined }}>
                        {item.title}
                      </h3>
                    )}
                    {item.text && (
                      <p className="text-sm text-silver/60 leading-relaxed" style={{ color: item.style?.color || undefined }}>
                        {item.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            );
          }

          case "divider":
            return <hr key={i} className="border-silver/10 my-8" />;

          default:
            return null;
        }
      })}
    </div>
  );
}
