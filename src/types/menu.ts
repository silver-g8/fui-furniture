export interface MenuItemBadge {
  label: string | number;
  color?: string;
  floating?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  externalLink?: string;
  order: number;
  items?: MenuItem[];
  permission?: string;
  badge?: MenuItemBadge;
  disabled?: boolean;
}

export interface MenuCategory {
  id: string;
  label: string;
  icon: string;
  order: number;
  items: MenuItem[];
  expanded?: boolean;
  permission?: string;
}

export interface MenuState {
  leftDrawerOpen: boolean;
  expandedCategories: string[];
  expandedItems: string[];
  activeMenuItem: string | null;
  menuStructure: MenuCategory[];
}

export interface NavigationState {
  currentRoute: string;
  previousRoute: string | null;
  routeParams: Record<string, unknown>;
  queryParams: Record<string, unknown>;
}

export type MenuStructure = MenuCategory[];

