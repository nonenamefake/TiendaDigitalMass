import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from apps.catalog.models import Category, Inventory, Product, Store

STORES = [
    ("MASS-LIM-01", "Mass Miraflores", "Miraflores", "Av. Larco 345", -12.121, -77.029),
    ("MASS-LIM-02", "Mass San Isidro", "San Isidro", "Av. Javier Prado 1234", -12.094, -77.022),
    ("MASS-LIM-03", "Mass Surco", "Santiago de Surco", "Av. Caminos del Inca 500", -12.144, -76.998),
]

CATEGORIES = [
    ("Abarrotes", "abarrotes", "shopping-basket"),
    ("Bebidas", "bebidas", "wine-bottle"),
    ("Lacteos", "lacteos", "cheese"),
    ("Limpieza", "limpieza", "broom"),
    ("Cuidado Personal", "cuidado-personal", "soap"),
    ("Panaderia", "panaderia", "bread-slice"),
    ("Carnes y Pollos", "carnes", "drumstick-bite"),
    ("Frutas y Verduras", "frutas-verduras", "carrot"),
]

PRODUCTS = {
    "abarrotes": [
        ("Arroz Costeno 5kg", "Costeno", 24.90),
        ("Arroz Tottus 5kg", "Tottus", 22.50),
        ("Azucar Rubia 1kg", "Cartavio", 4.50),
        ("Aceite Primor 1L", "Primor", 8.90),
        ("Aceite Cocinero 1L", "Cocinero", 7.50),
        ("Fideos Don Vittorio 500g", "Don Vittorio", 3.20),
        ("Fideos Molitalia 500g", "Molitalia", 2.90),
        ("Salsa de Tomate Pomarola 200g", "Pomarola", 3.50),
        ("Atun Florida 170g", "Florida", 5.90),
        ("Atun Real 170g", "Real", 6.20),
        ("Frijol Canario 500g", "Costeno", 6.50),
        ("Lenteja 500g", "Costeno", 5.20),
        ("Quinua 500g", "AltaMira", 8.90),
        ("Sal de Mesa 1kg", "Marina", 2.10),
        ("Vinagre Tres Estrellas 500ml", "Tres Estrellas", 3.20),
    ],
    "bebidas": [
        ("Inca Kola 1.5L", "Inca Kola", 6.50),
        ("Inca Kola 3L", "Inca Kola", 9.90),
        ("Coca Cola 1.5L", "Coca Cola", 6.80),
        ("Coca Cola 3L", "Coca Cola", 10.50),
        ("Sprite 1.5L", "Sprite", 6.50),
        ("Agua San Luis 2.5L", "San Luis", 3.50),
        ("Agua Cielo 2.5L", "Cielo", 3.20),
        ("Cerveza Cristal 6 pack", "Cristal", 23.90),
        ("Cerveza Pilsen 6 pack", "Pilsen", 24.50),
        ("Jugo Frugos Naranja 1L", "Frugos", 5.20),
        ("Jugo Pulp Durazno 1L", "Pulp", 4.90),
    ],
    "lacteos": [
        ("Leche Gloria Entera 1L", "Gloria", 4.80),
        ("Leche Laive Light 1L", "Laive", 5.20),
        ("Yogurt Gloria Fresa 1kg", "Gloria", 8.90),
        ("Yogurt Laive Vainilla 1kg", "Laive", 9.20),
        ("Queso Fresco 500g", "Bonle", 14.50),
        ("Mantequilla Gloria 200g", "Gloria", 7.90),
        ("Crema de Leche Nestle 200ml", "Nestle", 4.50),
        ("Leche Evaporada Gloria 400g", "Gloria", 5.30),
    ],
    "limpieza": [
        ("Detergente Ariel 800g", "Ariel", 12.90),
        ("Detergente Sapolio 800g", "Sapolio", 9.50),
        ("Lavavajilla Sapolio 360g", "Sapolio", 4.90),
        ("Lejia Clorox 1L", "Clorox", 5.20),
        ("Suavizante Suavitel 1L", "Suavitel", 8.90),
        ("Limpiador Pino 1L", "Pinesol", 7.50),
        ("Papel Higienico Elite 4 rollos", "Elite", 8.90),
        ("Papel Higienico Suave 4 rollos", "Suave", 7.50),
    ],
    "cuidado-personal": [
        ("Shampoo Head and Shoulders 400ml", "H&S", 18.90),
        ("Shampoo Pantene 400ml", "Pantene", 17.50),
        ("Jabon Lux 3 pack", "Lux", 6.90),
        ("Jabon Protex 3 pack", "Protex", 7.50),
        ("Pasta Dental Colgate 90g", "Colgate", 5.50),
        ("Cepillo Dental Oral-B", "Oral-B", 6.90),
        ("Desodorante Rexona 150ml", "Rexona", 12.50),
        ("Toallas Sanitarias Nosotras 10un", "Nosotras", 5.90),
    ],
    "panaderia": [
        ("Pan Frances x10", "Mass", 3.50),
        ("Pan Integral x10", "Mass", 4.20),
        ("Pan de Yema x10", "Mass", 5.50),
        ("Tostadas Bimbo 200g", "Bimbo", 6.90),
        ("Pan de Molde Bimbo 600g", "Bimbo", 8.50),
    ],
    "carnes": [
        ("Pollo Entero por kg", "San Fernando", 12.50),
        ("Pechuga de Pollo kg", "San Fernando", 16.90),
        ("Carne Molida kg", "Mass", 22.90),
        ("Bistec de Res kg", "Mass", 28.50),
        ("Chuleta de Cerdo kg", "Mass", 19.90),
        ("Hot Dog Otto Kunz 250g", "Otto Kunz", 8.90),
        ("Jamonada Laive 200g", "Laive", 7.50),
    ],
    "frutas-verduras": [
        ("Manzana Israel kg", "Mass", 6.90),
        ("Platano Seda kg", "Mass", 3.50),
        ("Naranja Valencia kg", "Mass", 4.20),
        ("Palta Fuerte kg", "Mass", 12.90),
        ("Tomate Italiano kg", "Mass", 4.50),
        ("Papa Amarilla kg", "Mass", 3.90),
        ("Cebolla Roja kg", "Mass", 3.20),
        ("Limon Sutil kg", "Mass", 5.50),
        ("Zanahoria kg", "Mass", 2.90),
    ],
}


class Command(BaseCommand):
    help = "Carga datos demo del catalogo (categorias, tiendas, productos, inventario)"

    def add_arguments(self, parser):
        parser.add_argument("--flush", action="store_true", help="Borra el catalogo existente antes de cargar")

    @transaction.atomic
    def handle(self, *args, **opts):
        if opts["flush"]:
            self.stdout.write(self.style.WARNING("Flushing catalogo..."))
            Inventory.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Store.objects.all().delete()

        stores = []
        for code, name, district, address, lat, lng in STORES:
            store, _ = Store.objects.get_or_create(
                code=code,
                defaults={"name": name, "district": district, "address": address, "lat": Decimal(str(lat)), "lng": Decimal(str(lng))},
            )
            stores.append(store)

        cats = {}
        for name, slug, icon in CATEGORIES:
            cat, _ = Category.objects.get_or_create(slug=slug, defaults={"name": name, "icon": icon})
            cats[slug] = cat

        random.seed(42)
        product_count = 0
        for cat_slug, items in PRODUCTS.items():
            cat = cats[cat_slug]
            for idx, (name, brand, price) in enumerate(items, start=1):
                sku = f"{cat_slug.upper()[:5]}-{idx:03d}"
                unit = "kg" if "kg" in name.lower() else ("L" if "L" in name else "un")
                slug = slugify(f"{name}-{sku}")[:220]
                product, created = Product.objects.update_or_create(
                    sku=sku,
                    defaults={
                        "name": name,
                        "slug": slug,
                        "brand": brand,
                        "category": cat,
                        "price": Decimal(str(price)),
                        "unit": unit,
                        "description": f"{name} - producto disponible en tiendas Mass.",
                        "image_url": f"https://picsum.photos/seed/{sku}/400/400",
                    },
                )
                product_count += 1
                for store in stores:
                    Inventory.objects.update_or_create(
                        product=product,
                        store=store,
                        defaults={"stock_qty": random.randint(0, 80)},
                    )

        self.stdout.write(self.style.SUCCESS(
            f"OK: {len(stores)} tiendas, {len(cats)} categorias, {product_count} productos."
        ))
