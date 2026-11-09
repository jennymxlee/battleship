import { expect, test } from '@playwright/test'

for (const difficulty of ['Easy', 'Medium', 'Hard']) {
  test(`complete a game against ${difficulty} and start again`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('./')
    await page.clock.install()
    await page.getByRole('radio', { name: new RegExp(difficulty) }).check()
    await page.getByRole('button', { name: /Continue/ }).click()
    await expect(page.getByRole('heading', { name: 'Take your positions' })).toBeFocused()
    await page.getByRole('button', { name: 'Randomize' }).click()
    await page.getByRole('button', { name: /Start battle/ }).click()
    const enemy = page.getByRole('grid', { name: 'Enemy waters' })
    const own = page.getByRole('grid', { name: 'Your fleet' })
    let aiShots = 0
    for (let index = 0; index < 100; index++) {
      await enemy.getByRole('button', { name: /, not fired$/ }).first().click()
      if (await page.getByRole('dialog').count()) break
      await expect(enemy).toHaveAttribute('aria-disabled', 'true')
      await page.clock.runFor(650)
      aiShots++
      if (await page.getByRole('dialog').count()) break
      // Exactly one new AI shot each turn: repeats cannot inflate this count.
      await expect(own.getByRole('button', { name: /, (miss|hit|sunk)/ })).toHaveCount(aiShots)
      await expect(enemy).toHaveAttribute('aria-disabled', 'false')
    }
    const result = page.getByRole('dialog')
    await expect(result).toBeVisible()
    await expect(result.getByRole('heading')).toHaveText(/You (win!|lose)/)
    await result.getByRole('button', { name: 'View boards' }).click()
    await expect(result).toHaveCount(0)
    await expect(enemy).toHaveAttribute('aria-disabled', 'true')
    await page.getByRole('button', { name: 'Play again' }).click()
    await expect(page.getByRole('heading', { name: 'Take your positions' })).toBeFocused()
    await expect(page.getByRole('button', { name: /Start battle/ })).toBeDisabled()
    expect(errors).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
