import type { MenuCategory, MenuItem, MenuStructure } from '@/types/menu';
import { menuStructure as defaultMenuStructure } from '@/config/menu';

type MenuNode = MenuCategory | MenuItem;

const isMenuItem = (node: MenuNode | null): node is MenuItem =>
  !!node && 'route' in node;

function flattenMenu(structure: MenuStructure): MenuItem[] {
  const items: MenuItem[] = [];

  const traverse = (nodes: MenuItem[]) => {
    nodes.forEach((node) => {
      items.push(node);
      if (node.items?.length) {
        traverse(node.items);
      }
    });
  };

  structure.forEach((category) => {
    traverse(category.items);
  });

  return items;
}

function findPathByRoute(
  structure: MenuStructure,
  route: string,
): { category: MenuCategory; path: MenuItem[] } | null {
  for (const category of structure) {
    const found = depthFirstSearch(category.items, (item) => {
      if (!item.route) {
        return false;
      }
      const normalized = item.route.replace(/\/+$/, '');
      return normalized === route.replace(/\/+$/, '');
    });

    if (found) {
      return { category, path: found.path };
    }
  }

  return null;
}

function depthFirstSearch(
  items: MenuItem[],
  predicate: (item: MenuItem, ancestors: MenuItem[]) => boolean,
  ancestors: MenuItem[] = [],
): { item: MenuItem; path: MenuItem[] } | null {
  for (const item of items) {
    const currentAncestors = [...ancestors, item];

    if (predicate(item, ancestors)) {
      return { item, path: currentAncestors };
    }

    if (item.items?.length) {
      const result = depthFirstSearch(item.items, predicate, currentAncestors);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

function findNodeById(structure: MenuStructure, id: string): MenuNode | null {
  const category = structure.find((cat) => cat.id === id);
  if (category) {
    return category;
  }

  for (const cat of structure) {
    const result = depthFirstSearch(cat.items, (item) => item.id === id);
    if (result) {
      return result.item;
    }
  }

  return null;
}

export function useMenu(structure: MenuStructure = defaultMenuStructure) {
  const flattened = flattenMenu(structure);

  const findItemById = (id: string): MenuItem | null => {
    const node = findNodeById(structure, id);
    return isMenuItem(node) ? node : null;
  };

  const findCategoryById = (id: string): MenuCategory | null => {
    const node = findNodeById(structure, id);
    return node && 'items' in node && 'order' in node && 'icon' in node ? (node as MenuCategory) : null;
  };

  const findItemByRoute = (route: string): MenuItem | null => {
    const match = findPathByRoute(structure, route);
    return match?.path.at(-1) ?? null;
  };

  const getBreadcrumbs = (route: string): (MenuCategory | MenuItem)[] => {
    const match = findPathByRoute(structure, route);
    if (!match) {
      return [];
    }
    return [match.category, ...match.path];
  };

  const getAllRoutes = (): string[] => flattened.map((item) => item.route).filter(Boolean) as string[];

  return {
    categories: structure,
    flattened,
    findItemById,
    findCategoryById,
    findItemByRoute,
    getBreadcrumbs,
    getAllRoutes,
  };
}

