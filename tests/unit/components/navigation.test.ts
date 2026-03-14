import { describe, it, expect } from 'vitest';
import { navItems } from '@/components/layout/nav-items';

describe('Navigation Items', () => {
  it('should have 8 navigation items', () => {
    expect(navItems).toHaveLength(8);
  });

  it('each item should have label, href, and icon', () => {
    for (const item of navItems) {
      expect(item.label).toBeTruthy();
      expect(item.href).toMatch(/^\//);
      expect(item.icon).toBeDefined();
    }
  });

  it('should contain expected routes', () => {
    const hrefs = navItems.map((item) => item.href);
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/chat');
    expect(hrefs).toContain('/transactions');
    expect(hrefs).toContain('/subscriptions');
    expect(hrefs).toContain('/projections');
    expect(hrefs).toContain('/retirement');
    expect(hrefs).toContain('/settings');
    expect(hrefs).toContain('/reports');
  });
});
