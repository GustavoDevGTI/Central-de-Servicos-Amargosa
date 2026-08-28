"use client";

import { useMemo, useState } from "react";

export type OrganogramEntry = {
  id: string;
  level: number;
  code: string;
  name: string;
  isWorkgroup: boolean;
};

type TreeNode = OrganogramEntry & { children: TreeNode[] };

function buildTree(entries: OrganogramEntry[]) {
  const roots: TreeNode[] = [];
  const stack: TreeNode[] = [];

  for (const entry of entries) {
    const node: TreeNode = { ...entry, children: [] };
    if (entry.level === 0) roots.push(node);
    else {
      const parent = stack[entry.level - 1] || stack.at(-1);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    stack[entry.level] = node;
    stack.length = entry.level + 1;
  }
  return roots;
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) return nodes;
  return nodes.flatMap((node) => {
    const children = filterTree(node.children, query);
    const matches = `${node.code} ${node.name}`.toLocaleLowerCase("pt-BR").includes(query);
    return matches || children.length ? [{ ...node, children }] : [];
  });
}

function countNodes(nodes: TreeNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countNodes(node.children), 0);
}

function Branch({ node, expanded, searching, toggle }: { node: TreeNode; expanded: Set<string>; searching: boolean; toggle: (id: string) => void }) {
  const hasChildren = node.children.length > 0;
  const isOpen = searching || expanded.has(node.id);
  const content = (
    <>
      <span className={`organogram-node-icon${node.isWorkgroup ? " is-workgroup" : ""}`} aria-hidden="true">{node.isWorkgroup ? "👥" : ""}</span>
      <span className="organogram-node-text"><strong>{node.code}</strong><small>{node.name}</small></span>
      {hasChildren && <b className="organogram-node-toggle" aria-hidden="true">{isOpen ? "−" : "+"}</b>}
    </>
  );

  return (
    <li className={`organogram-branch level-${node.level}${node.isWorkgroup ? " is-workgroup" : ""}`}>
      {hasChildren ? (
        <button type="button" className="organogram-node" aria-expanded={isOpen} onClick={() => toggle(node.id)}>{content}</button>
      ) : (
        <div className="organogram-node">{content}</div>
      )}
      {hasChildren && isOpen && <ul>{node.children.map((child) => <Branch key={child.id} node={child} expanded={expanded} searching={searching} toggle={toggle} />)}</ul>}
    </li>
  );
}

export default function Organogram({ entries }: { entries: OrganogramEntry[] }) {
  const tree = useMemo(() => buildTree(entries), [entries]);
  const allExpandableIds = useMemo(() => {
    const ids: string[] = [];
    const visit = (nodes: TreeNode[]) => nodes.forEach((node) => { if (node.children.length) ids.push(node.id); visit(node.children); });
    visit(tree);
    return ids;
  }, [tree]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(tree.map((node) => node.id)));
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visibleTree = useMemo(() => filterTree(tree, normalizedQuery), [tree, normalizedQuery]);
  const visibleCount = countNodes(visibleTree);

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="organogram-browser">
      <div className="organogram-tools">
        <label>
          <span>Buscar setor, unidade ou sigla</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: SEAFI, Tributos, Educação" />
        </label>
        <div>
          <button type="button" onClick={() => setExpanded(new Set(allExpandableIds))}>Expandir tudo</button>
          <button type="button" onClick={() => setExpanded(new Set())}>Recolher tudo</button>
        </div>
      </div>
      <p className="organogram-count" aria-live="polite">{normalizedQuery ? `${visibleCount} resultado${visibleCount === 1 ? "" : "s"} na hierarquia` : `${entries.length} setores, unidades e grupos cadastrados`}</p>
      <div className="organogram-municipality"><strong>Município de Amargosa</strong><span>Estrutura administrativa</span></div>
      {visibleTree.length ? (
        <ul className="organogram-roots">{visibleTree.map((node) => <Branch key={node.id} node={node} expanded={expanded} searching={Boolean(normalizedQuery)} toggle={toggle} />)}</ul>
      ) : (
        <p className="organogram-empty">Nenhum setor corresponde à busca.</p>
      )}
    </div>
  );
}
