import { describe, it, expect } from 'vitest';
import { navItems, navSections } from '@/components/layout/nav-items';

describe('Navigation Items', () => {
  it('should have 2 navigation sections', () => {
    expect(navSections).toHaveLength(2);
  });

  it('navItems flat list should include all section items', () => {
    const totalItems = navSections.reduce((sum, s) => sum + s.items.length, 0);
    expect(navItems).toHaveLength(totalItems);
  });

  it('each item should have label, href, and icon', () => {
    for (const item of navItems) {
      expect(item.label).toBeTruthy();
      expect(item.href).toMatch(/^\//);
      expect(item.icon).toBeDefined();
    }
  });

  it('should contain expected core routes', () => {
    const hrefs = navItems.map((item) => item.href);
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/transactions');
    expect(hrefs).toContain('/cashflow');
    expect(hrefs).toContain('/goals');
    expect(hrefs).toContain('/projections');
    expect(hrefs).toContain('/reports');
  });

  it('should mark pro items correctly', () => {
    const proItems = navItems.filter((item) => item.pro);
    expect(proItems.length).toBeGreaterThan(0);
    expect(proItems.every((item) => item.pro === true)).toBe(true);
  });

  it('sections should have titles', () => {
    for (const section of navSections) {
      expect(section.title).toBeTruthy();
      expect(section.items.length).toBeGreaterThan(0);
    }
  });
});
