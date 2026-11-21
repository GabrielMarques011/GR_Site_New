import { expect, test } from "@playwright/test";

/**
 * Testes de ponta a ponta da loja pública. Exigem NEXT_PUBLIC_SUPABASE_URL e
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY configurados em .env.local apontando
 * para o projeto Supabase real (ver README.md / TESTING.md).
 */

test("carrega a página inicial com o nome da loja", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
});

test("navega até o catálogo de produtos", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Produtos" }).first().click();
  await expect(page).toHaveURL(/\/produtos$/);
});

test("busca por um produto filtra o catálogo", async ({ page }) => {
  await page.goto("/produtos");
  const search = page.getByPlaceholder("Buscar produtos...");
  await search.fill("caneca");
  await search.press("Enter");
  await expect(page).toHaveURL(/busca=caneca/);
});

test("carrinho vazio mostra chamada para ver produtos", async ({ page }) => {
  await page.goto("/carrinho");
  await expect(page.getByText("Seu carrinho está vazio.")).toBeVisible();
});

test("painel administrativo redireciona visitante não autenticado para o login", async ({
  page,
}) => {
  await page.goto("/administracao");
  await expect(page).toHaveURL(/\/administracao\/login/);
});
