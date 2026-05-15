from rest_framework import serializers

from apps.catalog.serializers import StoreSerializer
from apps.payments.models import Payment

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_slug = serializers.CharField(source="product.slug", read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id", "product_slug", "sku_snapshot", "name_snapshot", "image_snapshot",
            "qty", "unit_price", "line_total",
        )


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ("method", "status", "amount", "currency", "mock_reference", "paid_at")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    store = StoreSerializer(read_only=True)
    payment = PaymentSerializer(read_only=True)
    is_cancelable = serializers.BooleanField(read_only=True)

    class Meta:
        model = Order
        fields = (
            "id", "status", "store",
            "delivery_mode", "delivery_date", "delivery_slot", "address",
            "payment_method", "subtotal", "discount", "total", "currency",
            "payment", "items", "is_cancelable",
            "created_at", "updated_at", "cancelled_at",
        )


class CheckoutSerializer(serializers.Serializer):
    delivery_mode = serializers.ChoiceField(choices=Order.DeliveryMode.choices)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    address_id = serializers.IntegerField(required=False, allow_null=True)
    delivery_date = serializers.DateField(required=False, allow_null=True)
    delivery_slot = serializers.CharField(required=False, allow_blank=True, max_length=20)
