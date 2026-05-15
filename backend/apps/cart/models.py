from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.catalog.models import Product, Store


class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart")
    store = models.ForeignKey(Store, null=True, blank=True, on_delete=models.SET_NULL, related_name="carts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart({self.user.email})"

    @property
    def subtotal(self) -> Decimal:
        return sum((it.line_total for it in self.items.all()), Decimal("0"))

    @property
    def total_qty(self) -> int:
        return sum((it.qty for it in self.items.all()), 0)


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="+")
    qty = models.PositiveIntegerField(default=1)
    unit_price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["cart", "product"], name="uniq_cartitem_cart_product"),
        ]
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.product.sku} x {self.qty}"

    @property
    def line_total(self) -> Decimal:
        return self.unit_price_snapshot * self.qty
