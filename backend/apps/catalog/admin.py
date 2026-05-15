from django.contrib import admin

from .models import Category, Inventory, Product, Store


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "district", "is_active")
    list_filter = ("district", "is_active")
    search_fields = ("code", "name")


class InventoryInline(admin.TabularInline):
    model = Inventory
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("sku", "name", "brand", "category", "price", "is_active")
    list_filter = ("category", "is_active", "brand")
    search_fields = ("sku", "name", "brand")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [InventoryInline]


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ("product", "store", "stock_qty", "updated_at")
    list_filter = ("store",)
    search_fields = ("product__sku", "product__name")
