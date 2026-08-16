using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Catalog.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Result<string>>
{
    private readonly CatalogDbContext _context;

    public UpdateProductCommandHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (product is null)
        {
            return Result<string>.Failure(Error.NotFound("Product.NotFound", $"Product with ID '{request.Id}' not found."));
        }

        // SKU must stay unique across other products.
        var skuTaken = await _context.Products
            .AnyAsync(p => p.SKU == request.SKU && p.Id != request.Id, cancellationToken);

        if (skuTaken)
        {
            return Result<string>.Failure(Error.Conflict("Product.SKUExists", $"A product with SKU '{request.SKU}' already exists."));
        }

        // Verify category exists
        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == request.CategoryId, cancellationToken);

        if (!categoryExists)
        {
            return Result<string>.Failure(Error.NotFound("Category.NotFound", $"Category with ID '{request.CategoryId}' not found."));
        }

        // Verify brand exists if provided
        if (!string.IsNullOrWhiteSpace(request.BrandId))
        {
            var brandExists = await _context.Brands
                .AnyAsync(b => b.Id == request.BrandId, cancellationToken);

            if (!brandExists)
            {
                return Result<string>.Failure(Error.NotFound("Brand.NotFound", $"Brand with ID '{request.BrandId}' not found."));
            }
        }

        product.Name = request.Name;
        product.SKU = request.SKU;
        product.Description = request.Description;
        product.ShortDescription = request.ShortDescription;
        product.Price = request.Price;
        product.CompareAtPrice = request.CompareAtPrice;
        product.StockStatus = request.StockStatus;
        product.Quantity = request.Quantity;
        product.CategoryId = request.CategoryId;
        product.BrandId = request.BrandId;
        product.Weight = request.Weight;
        product.Length = request.Length;
        product.Width = request.Width;
        product.Height = request.Height;
        product.IsActive = request.IsActive;
        product.IsFeatured = request.IsFeatured;
        product.Slug = GenerateSlug(request.Name);
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success(product.Id);
    }

    private static string GenerateSlug(string name)
    {
        return name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("'", "")
            .Replace("\"", "");
    }
}
