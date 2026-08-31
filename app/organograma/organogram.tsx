export type OrganogramEntry = {
  id: string;
  level: number;
  code: string;
  name: string;
  isWorkgroup: boolean;
};

type TreeNode = OrganogramEntry & { children: TreeNode[] };

const featuredRootOrder = new Map([
  ["GP", 0],
  ["GVP", 1],
  ["PJM", 2],
  ["SEAFI", 3],
  ["CGM", 4],
]);

function rootPriority(node: TreeNode) {
  const featuredPriority = featuredRootOrder.get(node.code.trim().toUpperCase());
  if (featuredPriority !== undefined) return featuredPriority;
  if (node.name.trim().toLocaleLowerCase("pt-BR").startsWith("secretaria")) return 5;
  return 6;
}

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
  return roots.sort((a, b) => rootPriority(a) - rootPriority(b));
}

function Branch({ node }: { node: TreeNode }) {
  const hasChildren = node.children.length > 0;
  const isDrawer = node.level === 0 && hasChildren;
  const nodeContent = <>
    {node.isWorkgroup && <span className="organogram-workgroup-icon" aria-hidden="true">👥</span>}
    <span className="organogram-node-text"><strong>{node.code}</strong><small>{node.name}</small></span>
    {hasChildren && <span className="organogram-child-count">{node.children.length} {node.children.length === 1 ? "unidade" : "unidades"}</span>}
  </>;

  return (
    <li className={`organogram-branch level-${node.level}${node.isWorkgroup ? " is-workgroup" : ""}`}>
      {isDrawer ? <details className="organogram-drawer">
        <summary className="organogram-node organogram-drawer-toggle">{nodeContent}<span className="organogram-drawer-chevron" aria-hidden="true" /></summary>
        <ul>{node.children.map((child) => <Branch key={child.id} node={child} />)}</ul>
      </details> : <>
        <div className="organogram-node">{nodeContent}</div>
        {hasChildren && <ul>{node.children.map((child) => <Branch key={child.id} node={child} />)}</ul>}
      </>}
    </li>
  );
}

export default function Organogram({ entries }: { entries: OrganogramEntry[] }) {
  const tree = buildTree(entries);

  return (
    <div className="organogram-browser">
      <div className="organogram-municipality"><strong>Município de Amargosa</strong><span>Estrutura administrativa</span></div>
      <p className="organogram-level-label">Órgãos e unidades diretamente vinculados ao Município</p>
      <div className="organogram-legend" aria-label="Legenda"><span><b aria-hidden="true">👥</b> Grupo de trabalho</span></div>
      <ul className="organogram-roots">{tree.map((node) => <Branch key={node.id} node={node} />)}</ul>
    </div>
  );
}
