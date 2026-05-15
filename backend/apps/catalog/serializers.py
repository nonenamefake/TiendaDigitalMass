from rest_framework import serializers

from .models import Category, Inventory, Product, Store


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "parent", "icon")


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ("id", "code", "name", "district", "address", "lat", "lng", "is_active")


class InventorySerializer(serializers.ModelSerializer):
    store = StoreSerializer(read_only=True)

    class Meta:
        model = Inventory
        fields = ("store", "stock_qty", "updated_at")


class ProductListSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "sku",
            "name",
            "slug",
            "brand",
            "category",
            "price",
            "currency",
            "image_url",
            "unit",
            "in_stock",
        )

    def get_in_stock(self, obj):
        total = getattr(obj, "_total_stock", None)
        if total is not None:
            return total > 0
        return obj.inventory.filter(stock_qty__gt=0).exists()


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    inventory = InventorySerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "sku",
            "name",
            "slug",
            "description",
            "brand",
            "category",
            "price",
            "currency",
            "image_url",
            "unit",
            "is_active",
            "inventory",
            "created_at",
            "updated_at",
        )


class SuggestSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    image_url = serializers.CharField(allow_blank=True)
