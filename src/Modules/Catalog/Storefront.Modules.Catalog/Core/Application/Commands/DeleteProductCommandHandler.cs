using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Catalog.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, Result<bool>>
{
    private readonly CatalogDbContext _context;

    public DeleteProductCommandHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (product is null)
        {
            return Result<bool>.Failure(Error.NotFound("Product.NotFound", $"Product with ID '{request.Id}' not found."));
        }

        // Block deletion if this product is a component of another bundle
        // (that relationship is Restrict at the database level).
        var usedInBundle = await _context.ProductBundleItems
            .AnyAsync(bi => bi.ComponentProductId == request.Id, cancellationToken);

        if (usedInBundle)
        {
            return Result<bool>.Failure(Error.Conflict(
                "Product.InUse",
                "This product is part of a bundle and cannot be deleted. Remove it from the bundle first."));
        }

        // Product images and this product's own bundle items cascade-delete.
        _context.Products.Remove(product);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
