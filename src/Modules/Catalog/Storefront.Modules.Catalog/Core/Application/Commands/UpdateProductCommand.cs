using MediatR;
using Storefront.Modules.Catalog.Core.Domain.Enums;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed record UpdateProductCommand(
    string Id,
    string Name,
    string SKU,
    string? Description,
    string? ShortDescription,
    decimal? Price,
    decimal? CompareAtPrice,
    StockStatus StockStatus,
    int Quantity,
    string CategoryId,
    string? BrandId,
    decimal? Weight,
    decimal? Length,
    decimal? Width,
    decimal? Height,
    bool IsActive = true,
    bool IsFeatured = false
) : IRequest<Result<string>>;
