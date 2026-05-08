const allowedTags = new Set(["P", "H2", "H3", "STRONG", "EM", "U", "S", "UL", "OL", "LI", "BLOCKQUOTE", "A", "IMG", "HR", "BR"]);
const allowedAttrs: Record<string, string[]> = {
  A: ["href", "target", "rel"],
  IMG: ["src", "alt"],
};

export function sanitizeHtml(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("script, iframe, object, embed, style").forEach((node) => node.remove());

  const visit = (node: ChildNode) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (!allowedTags.has(element.tagName)) {
        const fragment = document.createDocumentFragment();
        while (element.firstChild) {
          fragment.appendChild(element.firstChild);
        }
        element.replaceWith(fragment);
        Array.from(fragment.childNodes).forEach(visit);
        return;
      }

      Array.from(element.attributes).forEach((attr) => {
        const attrName = attr.name.toLowerCase();
        const attrValue = attr.value.trim().toLowerCase();
        const allowed = allowedAttrs[element.tagName]?.includes(attrName) ?? false;
        if (!allowed || attrName.startsWith("on") || attrValue.startsWith("javascript:")) {
          element.removeAttribute(attr.name);
        }
      });

      if (element.tagName === "A") {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
      }
    }

    Array.from(node.childNodes).forEach(visit);
  };

  Array.from(template.content.childNodes).forEach(visit);
  return template.innerHTML;
}
