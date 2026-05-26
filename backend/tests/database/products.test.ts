import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
	import.meta.dirname,
	'../../../supabase/migrations/20260523000000_create_products_table.sql',
);

const migrationSql = readFileSync(migrationPath, 'utf8');

describe('products migration', () => {
	it('defines the products table and the expected access rules', () => {
		expect(migrationSql).toContain('CREATE TABLE public.products');
		expect(migrationSql).toContain('name_pt TEXT NOT NULL');
		expect(migrationSql).toContain('name_en TEXT NOT NULL');
		expect(migrationSql).toContain('slug TEXT NOT NULL');
		expect(migrationSql).toContain('published BOOLEAN DEFAULT false NOT NULL');
		expect(migrationSql).toContain('display_order INTEGER DEFAULT 0 NOT NULL');
		expect(migrationSql).toContain(
			'CREATE INDEX idx_products_published_order ON public.products (published, display_order)',
		);
		expect(migrationSql).toContain('ALTER TABLE public.products ENABLE ROW LEVEL SECURITY');
		expect(migrationSql).toContain('Permitir leitura pública de produtos publicados');
		expect(migrationSql).toContain('Permitir modificações apenas para usuários autenticados');
		expect(migrationSql).toContain('INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)');
		expect(migrationSql).toContain('product-images');
		expect(migrationSql).toContain('Imagens do produto são publicas para visualização');
		expect(migrationSql).toContain('Apenas usuários autenticados fazem upload de imagens');
	});
});
