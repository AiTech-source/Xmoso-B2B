/**
 * MarkdownRenderer — Server-safe markdown to HTML converter.
 * No client-side JS needed, no external dependencies.
 * Renders directly as HTML during SSR — always visible.
 */

// Block-level transforms run first
function mdToHtml(md: string): string {
  if (!md) return "";

  let html = md;

  // Code blocks (fenced)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m: string, lang: string, code: string) => {
    const lc = lang ? ` class="language-${lang}"` : "";
    return `[[[CODE_BLOCK]]]<pre class="bg-deep-blue/30 border border-silver/10 rounded-lg p-4 overflow-x-auto my-6"><code${lc} class="text-sm text-silver/70 font-mono leading-relaxed">${code.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre>[[[/CODE_BLOCK]]]`;
  });

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="border-none border-t border-silver/10 my-10" />');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-forest/40 pl-4 my-6 text-silver/50 italic text-sm">$1</blockquote>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-light tracking-wide text-white mt-8 mb-3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-light tracking-wider text-white mt-10 mb-4 pb-2 border-b border-silver/10">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-light tracking-wider text-white mt-12 mb-6">$1</h1>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '[[[LI]]]$1[[[/LI]]]');
  html = html.replace(/((?:\[\[\[LI\]\]\].*?\[\[\[\/LI\]\]\]\n?)+)/g, '<ul class="list-disc list-inside text-silver/70 leading-relaxed mb-4 space-y-1 text-[15px]">$1</ul>');
  html = html.replace(/\[\[\[LI\]\]\]/g, '<li class="text-silver/70">');
  html = html.replace(/\[\[\[\/LI\]\]\]/g, '</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '[[[OLI]]]$1[[[/OLI]]]');
  html = html.replace(/((?:\[\[\[OLI\]\]\].*?\[\[\[\/OLI\]\]\]\n?)+)/g, '<ol class="list-decimal list-inside text-silver/70 leading-relaxed mb-4 space-y-1 text-[15px]">$1</ol>');
  html = html.replace(/\[\[\[OLI\]\]\]/g, '<li class="text-silver/70">');
  html = html.replace(/\[\[\[\/OLI\]\]\]/g, '</li>');

  // Tables: simplify - wrap in responsive container
  html = html.replace(/^\|(.+)\|$/gm, (m: string) => {
    if (m.includes("---")) return "";
    const cells = m.slice(1, -1).split("|").map((c: string) => c.trim());
    return `[[[TD]]]${cells.map((c: string) => `<td class="px-4 py-3 text-silver/70 text-sm border-b border-silver/5">${c}</td>`).join("")}[[[/TD]]]`;
  });
  html = html.replace(/((?:\[\[\[TD\]\]\].*?\[\[\[\/TD\]\]\]\n?)+)/g,
    '<div class="overflow-x-auto my-6 border border-silver/10 rounded-lg"><table class="w-full text-sm border-collapse"><tbody>$1</tbody></table></div>');
  html = html.replace(/\[\[\[TD\]\]\]/g, '<tr class="bg-row-even">');
  html = html.replace(/\[\[\[\/TD\]\]\]/g, '</tr>');

  // Inline transforms
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full h-auto my-6 mx-auto block" loading="lazy" />');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-forest hover:text-white transition-colors underline underline-offset-2">$1</a>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-deep-blue/40 rounded text-ice text-sm font-mono">$1</code>');
  // Bold+Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/85 font-medium">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="text-silver/70">$1</em>');

  // Paragraphs: lines that aren't already wrapped in block HTML
  html = html.replace(/^(?!<[hHpPpPpPpPpPpPpPpPpPpPpPpPpPpPpPpPpPpPpPpPpP])(?!$)(.+)$/gm, '<p class="text-silver/70 leading-relaxed mb-4 text-[15px]">$1</p>');

  // Clean up empty paragraphs and restore code blocks
  html = html.replace(/<p class="[^"]*">\s*<\/p>/g, "");
  html = html.replace(/\[\[\[CODE_BLOCK\]\]\]/g, "");
  html = html.replace(/\[\[\[\/CODE_BLOCK\]\]\]/g, "");

  return html;
}

export function MarkdownRenderer({ content }: { content: string }) {
  const html = mdToHtml(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
