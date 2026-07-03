import { expect, test } from '@playwright/test';

test.describe('Dungeons & Dragons app', () => {
  test('opens the sheet and navigates key management tabs', async ({ page }) => {
    await page.goto('/dungeons-and-dragons');

    await expect(page.getByText('Gellin McFellon')).toBeVisible();
    await expect(page.getByText('Dragonborn')).toBeVisible();
    await expect(page.getByText('Rogue 10')).toBeVisible();
    await expect(page.getByText('Wizard 2')).toBeVisible();

    await page.getByRole('button', { name: 'Open Dungeons & Dragons tab menu' }).click();
    await expect(page.getByRole('button', { name: 'Abilities, Saves, Senses' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Close Dungeons & Dragons tab menu' }).click();

    await page.getByRole('button', { name: 'Open Dungeons & Dragons tab menu' }).click();
    await page.getByRole('button', { name: 'Inventory' }).last().click();
    await expect(page.getByText('Equipment (4)')).toBeVisible();

    await page.getByRole('button', { name: 'More' }).click();
    await expect(page.getByText('Features & Traits')).toBeVisible();
    await expect(page.getByText('Class Attributes')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skills', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Background', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Notes', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Inventory' }).click();
    await expect(page.getByText('Inventory').first()).toBeVisible();
    await expect(page.getByText('Equipment (4)')).toBeVisible();

    await page.getByRole('button', { name: 'Spells' }).click();
    await expect(page.getByText('Spellbook')).toBeVisible();
    await expect(page.getByText('Spell Save DC')).toBeVisible();
    await expect(page.getByRole('button', { name: '1st spell slot 1' })).toBeVisible();
  });
});
