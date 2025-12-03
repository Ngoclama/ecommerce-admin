import { CategoryColumn } from "@/app/(dashboard)/[storeId]/(routes)/categories/components/columns";

interface CategoryWithParent {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  billboardLabel: string;
  parentName?: string | null;
  parentId?: string | null | undefined;
  productsCount: string;
  createdAt: string;
}

interface TreeNode extends CategoryWithParent {
  level: number;
  children?: TreeNode[];
}

/**
 * Build tree structure from flat category list
 */
export function buildCategoryTree(
  categories: CategoryWithParent[]
): TreeNode[] {
  const categoryMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // First pass: create all nodes
  categories.forEach((cat) => {
    categoryMap.set(cat.id, {
      ...cat,
      level: 0,
      children: [],
    });
  });

  // Second pass: build tree structure
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id)!;
    if (cat.parentId && cat.parentId.trim() !== "") {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        node.level = parent.level + 1;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        // Parent not found, treat as root
        roots.push(node);
      }
    } else {
      // No parent, it's a root
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Flatten tree structure to display in table with proper ordering
 */
export function flattenCategoryTree(
  tree: TreeNode[],
  expandedIds: Set<string> = new Set()
): CategoryColumn[] {
  const result: CategoryColumn[] = [];

  function traverse(nodes: TreeNode[]) {
    nodes.forEach((node) => {
      result.push({
        id: node.id,
        name: node.name,
        slug: node.slug,
        imageUrl: node.imageUrl || null,
        billboardLabel: node.billboardLabel,
        parentName: node.parentName,
        parentId: node.parentId || undefined,
        level: node.level,
        hasChildren: (node.children?.length || 0) > 0,
        productsCount: node.productsCount,
        createdAt: node.createdAt,
      });

      // If expanded or no children, traverse children
      if (expandedIds.has(node.id) || !node.children?.length) {
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      }
    });
  }

  traverse(tree);
  return result;
}

/**
 * Sort tree nodes by name at each level
 */
export function sortCategoryTree(tree: TreeNode[]): TreeNode[] {
  function sortRecursive(nodes: TreeNode[]): TreeNode[] {
    return nodes
      .map((node) => ({
        ...node,
        children: node.children ? sortRecursive(node.children) : [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return sortRecursive(tree);
}
