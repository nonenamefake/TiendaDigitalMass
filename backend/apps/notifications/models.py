from django.conf import settings
from django.db import models


class NotificationLog(models.Model):
    CHANNEL_CHOICES = [("email", "Email"), ("sms", "SMS"), ("push", "Push"), ("whatsapp", "WhatsApp")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    order = models.ForeignKey(
        "orders.Order", null=True, blank=True, on_delete=models.SET_NULL, related_name="notifications"
    )
    channel = models.CharField(max_length=12, choices=CHANNEL_CHOICES, default="email")
    event = models.CharField(max_length=60)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"[{self.channel}] {self.event} -> {self.user.email}"
