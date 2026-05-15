from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("sku_snapshot", "name_snapshot", "image_snapshot", "qty", "unit_price", "line_total")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "store", "status", "total", "created_at")
    list_filter = ("status", "delivery_mode", "payment_method")
    search_fields = ("user__email", "id")
    inlines = [OrderItemInline]
    readonly_fields = ("created_at", "updated_at", "cancelled_at")
