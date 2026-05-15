from django.urls import path

from .views import (
    CategoryListView,
    ProductDetailView,
    ProductListView,
    SearchSuggestView,
    StoreListView,
)

urlpatterns = [
    path("categories", CategoryListView.as_view(), name="category-list"),
    path("stores", StoreListView.as_view(), name="store-list"),
    path("products", ProductListView.as_view(), name="product-list"),
    path("products/<slug:slug>", ProductDetailView.as_view(), name="product-detail"),
    path("search/suggest", SearchSuggestView.as_view(), name="search-suggest"),
]
