from django.db.models import Q, Sum
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Product, Store
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    StoreSerializer,
    SuggestSerializer,
)


class CatalogPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class StoreListView(generics.ListAPIView):
    queryset = Store.objects.filter(is_active=True)
    serializer_class = StoreSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = CatalogPagination

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related("category")

        params = self.request.query_params
        category = params.get("category")
        store = params.get("store")
        q = params.get("q")
        min_price = params.get("min_price")
        max_price = params.get("max_price")
        ordering = params.get("ordering", "-created_at")

        if category:
            qs = qs.filter(category__slug=category)
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(brand__icontains=q) | Q(description__icontains=q))
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        if store:
            qs = qs.filter(inventory__store__code=store, inventory__stock_qty__gt=0).distinct()

        qs = qs.annotate(_total_stock=Sum("inventory__stock_qty"))

        allowed_orderings = {"price", "-price", "name", "-name", "-created_at", "created_at"}
        if ordering not in allowed_orderings:
            ordering = "-created_at"
        return qs.order_by(ordering)


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True).select_related("category").prefetch_related("inventory__store")
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


class SearchSuggestView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if len(q) < 2:
            return Response([])
        qs = (
            Product.objects.filter(is_active=True)
            .filter(Q(name__icontains=q) | Q(brand__icontains=q))
            .values("id", "name", "slug", "price", "image_url")[:10]
        )
        return Response(SuggestSerializer(qs, many=True).data)
