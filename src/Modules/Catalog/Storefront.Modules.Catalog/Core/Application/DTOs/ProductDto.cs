using Storefront.Modules.Catalog.Core.Domain.Enums;

namespace Storefront.Modules.Catalog.Core.Application.DTOs;

public sealed record ProductDto(
    string Id,
    string Name,
    string SKU,
    string? Description,
    string? ShortDescription,
    ProductType ProductType,
    decimal? Price,
    decimal? CompareAtPrice,
    decimal? BundlePrice,
    bool CanBeSoldSeparately,
    StockStatus StockStatus,
    int Quantity,
    string CategoryId,
    string CategoryName,
    string? BrandId,
    string? BrandName,
    bool IsActive,
    bool IsFeatured,
    string? PrimaryImageUrl,
    DateTime CreatedAt
);

