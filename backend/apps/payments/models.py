import uuid

from django.db import models


class Payment(models.Model):
    class Status(models.TextChoices):
        INITIATED = "initiated", "Iniciado"
        APPROVED = "approved", "Aprobado"
        REJECTED = "rejected", "Rechazado"

    order = models.OneToOneField("orders.Order", on_delete=models.CASCADE, related_name="payment")
    method = models.CharField(max_length=12)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.INITIATED)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="PEN")
    mock_reference = models.CharField(max_length=40, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Payment(order={self.order_id}, status={self.status})"

    @staticmethod
    def generate_reference() -> str:
        return f"MOCK-{uuid.uuid4().hex[:12].upper()}"
