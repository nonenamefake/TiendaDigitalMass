from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.accounts.models import Address
from apps.catalog.models import Product, Store


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", "Pendiente de pago"
        PAID = "paid", "Pagado"
        PREPARING = "preparing", "En preparacion"
        DISPATCHED = "dispatched", "Despachado"
        DELIVERED = "delivered", "Entregado"
        CANCELLED = "cancelled", "Cancelado"

    class DeliveryMode(models.TextChoices):
        DELIVERY = "delivery", "Delivery"
        PICKUP = "pickup", "Recojo en tienda"

    class PaymentMethod(models.TextChoices):
        CARD = "card", "Tarjeta"
        WALLET = "wallet", "Billetera digital"
        COD = "cod", "Contra entrega"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    store = models.ForeignKey(Store, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)

    delivery_mode = models.CharField(max_length=10, choices=DeliveryMode.choices, default=DeliveryMode.DELIVERY)
    delivery_date = models.DateField(null=True, blank=True)
    delivery_slot = models.CharField(max_length=20, blank=True, help_text="ej: 09-12, 12-15, 15-18")
    address = models.ForeignKey(Address, null=True, blank=True, on_delete=models.SET_NULL, related_name="orders")

    payment_method = models.CharField(max_length=10, choices=PaymentMethod.choices, default=PaymentMethod.CARD)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    currency = models.CharField(max_length=3, default="PEN")

    idempotency_key = models.CharField(max_length=80, blank=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"Order #{self.pk} ({self.status}) - {self.user.email}"

    CANCELABLE = {Status.PENDING_PAYMENT, Status.PAID, Status.PREPARING}

    @property
    def is_cancelable(self) -> bool:
        return self.status in self.CANCELABLE


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="+")
    sku_snapshot = models.CharField(max_length=40)
    name_snapshot = models.CharField(max_length=200)
    image_snapshot = models.URLField(blank=True)
    qty = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.sku_snapshot} x {self.qty}"
