from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("order", "method", "status", "amount", "mock_reference", "paid_at")
    list_filter = ("status", "method")
    search_fields = ("mock_reference", "order__id")
