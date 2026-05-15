from rest_framework import serializers

from apps.catalog.models import Product, Store
from apps.catalog.serializers import StoreSerializer

from .models import Cart, CartItem


class CartItemReadSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    sku = serializers.CharField(source="product.sku", read_only=True)
    name = serializers.CharField(source="product.name", read_only=True)
    slug = serializers.CharField(source="product.slug", read_only=True)
    image_url = serializers.CharField(source="product.image_url", read_only=True)
    unit = serializers.CharField(source="product.unit", read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ("id", "product_id", "sku", "name", "slug", "image_url", "unit", "qty", "unit_price_snapshot", "line_total")


class CartItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    qty = serializers.IntegerField(min_value=1, default=1)

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("Producto no encontrado o inactivo.")
        return value


class CartItemPatchSerializer(serializers.Serializer):
    qty = serializers.IntegerField(min_value=1)


class CartSerializer(serializers.ModelSerializer):
    store = StoreSerializer(read_only=True)
    items = CartItemReadSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_qty = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ("id", "store", "items", "subtotal", "total_qty", "updated_at")


class SetStoreSerializer(serializers.Serializer):
    store_code = serializers.CharField()

    def validate_store_code(self, value):
        if not Store.objects.filter(code=value, is_active=True).exists():
            raise serializers.ValidationError("Tienda no encontrada o inactiva.")
        return value
