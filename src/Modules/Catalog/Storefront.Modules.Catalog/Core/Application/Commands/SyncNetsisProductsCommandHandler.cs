using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Storefront.Modules.Catalog.Core.Application.DTOs;
using Storefront.Modules.Catalog.Core.Application.Exceptions;
using Storefront.Modules.Catalog.Core.Application.Interfaces;
using Storefront.Modules.Catalog.Core.Application.Settings;
using Storefront.Modules.Catalog.Core.Domain.Entities;
using Storefront.Modules.Catalog.Core.Domain.Enums;
using Storefront.Modules.Catalog.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed class SyncNetsisProductsCommandHandler : IRequestHandler<SyncNetsisProductsCommand, Result<NetsisSyncResultDto>>
{
    private readonly CatalogDbContext _context;
    private readonly INetsisClient _netsisClient;
    private readonly NetsisSettings _settings;
    private readonly ILogger<SyncNetsisProductsCommandHandler> _logger;

    public SyncNetsisProductsCommandHandler(
        CatalogDbContext context,
        INetsisClient netsisClient,
        NetsisSettings settings,
        ILogger<SyncNetsisProductsCommandHandler> logger)
    {
        _context = context;
        _netsisClient = netsisClient;
        _settings = settings;
        _logger = logger;
    }

    public async Task<Result<NetsisSyncResultDto>> Handle(SyncNetsisProductsCommand request, CancellationToken cancellationToken)
    {
        if (!_settings.Enabled)
        {
            return Result<NetsisSyncResultDto>.Failure(
                Error.Validation("Netsis.Disabled", "Netsis integration is disabled. Set Netsis:Enabled to true in configuration."));
        }

        IReadOnlyList<NetsisProductDto> netsisProducts;
        try
        {
            netsisProducts = await _netsisClient.GetProductsAsync(cancellationToken);
        }
        catch (NetsisIntegrationException ex)
        {
            _logger.LogError(ex, "Failed to fetch products from Netsis.");
            return Result<NetsisSyncResultDto>.Failure(Error.Failure("Netsis.FetchFailed", ex.Message));
        }

        var skus = netsisProducts.Select(p => p.StockCode).ToList();
        var existingProducts = await _context.Products
            .Where(p => skus.Contains(p.SKU))
            .ToDictionaryAsync(p => p.SKU, cancellationToken);

        var defaultCategoryId = _settings.DefaultCategoryId;
        var defaultCategoryValid = !string.IsNullOrWhiteSpace(defaultCategoryId)
            && await _context.Categories.AnyAsync(c => c.Id == defaultCategoryId, cancellationToken);

        var created = 0;
        var updated = 0;
        var skipped = 0;

        foreach (var netsisProduct in netsisProducts)
        {
            if (existingProducts.TryGetValue(netsisProduct.StockCode, out var product))
            {
                product.Name = netsisProduct.Name;
                product.Price = netsisProduct.SalesPrice ?? product.Price;
                product.Cost = netsisProduct.PurchasePrice ?? product.Cost;
                product.Quantity = (int)netsisProduct.OnHandQuantity;
                product.StockStatus = ResolveStockStatus(netsisProduct.OnHandQuantity, product.LowStockThreshold);
                product.IsActive = netsisProduct.IsActive;
                product.UpdatedAt = DateTime.UtcNow;
                updated++;
                continue;
            }

            if (!defaultCategoryValid)
            {
                _logger.LogWarning(
                    "Skipping new Netsis product {StockCode}: Netsis:DefaultCategoryId is not set to a valid Category Id.",
                    netsisProduct.StockCode);
                skipped++;
                continue;
            }

            var newProduct = new Product
            {
                Id = Guid.NewGuid().ToString(),
                Name = netsisProduct.Name,
                SKU = netsisProduct.StockCode,
                ProductType = ProductType.Simple,
                Price = netsisProduct.SalesPrice,
                Cost = netsisProduct.PurchasePrice,
                Quantity = (int)netsisProduct.OnHandQuantity,
                StockStatus = ResolveStockStatus(netsisProduct.OnHandQuantity, null),
                CategoryId = defaultCategoryId!,
                Slug = GenerateSlug(netsisProduct.Name, netsisProduct.StockCode),
                IsActive = netsisProduct.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(newProduct);
            existingProducts[netsisProduct.StockCode] = newProduct;
            created++;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var stockUpdated = 0;
        try
        {
            var stockLevels = await _netsisClient.GetStockLevelsAsync(cancellationToken);
            var quantityBySku = stockLevels
                .GroupBy(s => s.StockCode)
                .ToDictionary(g => g.Key, g => g.Sum(s => s.Quantity));

            foreach (var (sku, quantity) in quantityBySku)
            {
                if (!existingProducts.TryGetValue(sku, out var product))
                {
                    continue;
                }

                product.Quantity = (int)quantity;
                product.StockStatus = ResolveStockStatus(quantity, product.LowStockThreshold);
                product.UpdatedAt = DateTime.UtcNow;
                stockUpdated++;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (NetsisIntegrationException ex)
        {
            _logger.LogError(ex, "Failed to fetch/apply stock levels from Netsis. Product sync already committed.");
        }

        var result = new NetsisSyncResultDto(
            ProductsFetched: netsisProducts.Count,
            ProductsCreated: created,
            ProductsUpdated: updated,
            ProductsSkipped: skipped,
            StockLevelsUpdated: stockUpdated,
            SyncedAtUtc: DateTime.UtcNow);

        _logger.LogInformation(
            "Netsis sync complete: {Fetched} fetched, {Created} created, {Updated} updated, {Skipped} skipped, {StockUpdated} stock levels updated.",
            result.ProductsFetched, result.ProductsCreated, result.ProductsUpdated, result.ProductsSkipped, result.StockLevelsUpdated);

        return Result<NetsisSyncResultDto>.Success(result);
    }

    private static StockStatus ResolveStockStatus(decimal quantity, int? lowStockThreshold)
    {
        if (quantity <= 0)
        {
            return StockStatus.OutOfStock;
        }

        if (lowStockThreshold.HasValue && quantity <= lowStockThreshold.Value)
        {
            return StockStatus.LowStock;
        }

        return StockStatus.InStock;
    }

    private static string GenerateSlug(string name, string fallback)
    {
        var slug = name
            .ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("'", "")
            .Replace("\"", "");

        return string.IsNullOrWhiteSpace(slug) ? fallback.ToLowerInvariant() : slug;
    }
}
