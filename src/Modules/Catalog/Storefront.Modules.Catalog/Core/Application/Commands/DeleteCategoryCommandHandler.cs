using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Catalog.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, Result<bool>>
{
    private readonly CatalogDbContext _context;

    public DeleteCategoryCommandHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (category is null)
        {
            return Result<bool>.Failure(Error.NotFound("Category.NotFound", $"Category with ID '{request.Id}' not found."));
        }

        var hasProducts = await _context.Products
            .AnyAsync(p => p.CategoryId == request.Id, cancellationToken);

        if (hasProducts)
        {
            return Result<bool>.Failure(Error.Conflict(
                "Category.HasProducts",
                "This category still has products. Move or delete them before deleting the category."));
        }

        var hasChildren = await _context.Categories
            .AnyAsync(c => c.ParentId == request.Id, cancellationToken);

        if (hasChildren)
        {
            return Result<bool>.Failure(Error.Conflict(
                "Category.HasChildren",
                "This category has subcategories. Delete or move them first."));
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
