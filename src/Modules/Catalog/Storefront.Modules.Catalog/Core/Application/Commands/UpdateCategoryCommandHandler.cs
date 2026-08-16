using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Catalog.Infrastructure.Persistence;
using Storefront.SharedKernel;
using System.Text.RegularExpressions;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Result<string>>
{
    private readonly CatalogDbContext _context;

    public UpdateCategoryCommandHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<Result<string>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (category is null)
        {
            return Result<string>.Failure(Error.NotFound("Category.NotFound", $"Category with ID '{request.Id}' not found."));
        }

        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? GenerateSlug(request.Name)
            : GenerateSlug(request.Slug);

        // Slug must stay unique across other categories.
        var slugTaken = await _context.Categories
            .AnyAsync(c => c.Slug == slug && c.Id != request.Id, cancellationToken);

        if (slugTaken)
        {
            return Result<string>.Failure(Error.Conflict("Category.SlugExists", $"A category with slug '{slug}' already exists."));
        }

        if (!string.IsNullOrWhiteSpace(request.ParentId))
        {
            if (request.ParentId == request.Id)
            {
                return Result<string>.Failure(Error.Validation("Category.InvalidParent", "A category cannot be its own parent."));
            }

            var parentExists = await _context.Categories
                .AnyAsync(c => c.Id == request.ParentId, cancellationToken);

            if (!parentExists)
            {
                return Result<string>.Failure(Error.NotFound("Category.ParentNotFound", $"Parent category with ID '{request.ParentId}' not found."));
            }
        }

        category.Name = request.Name;
        category.Description = request.Description;
        category.Slug = slug;
        category.ParentId = request.ParentId;
        category.DisplayOrder = request.DisplayOrder;
        category.IsActive = request.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success(category.Id);
    }

    private static string GenerateSlug(string text)
    {
        var slug = text.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", " ").Trim();
        slug = slug.Replace(" ", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        return slug;
    }
}
