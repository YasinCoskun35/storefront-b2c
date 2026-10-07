using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Catalog.Core.Application.DTOs;
using Storefront.Modules.Catalog.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Queries;

public sealed class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, Result<IReadOnlyList<CategoryDto>>>
{
    private readonly CatalogDbContext _context;

    public GetCategoriesQueryHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IReadOnlyList<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Categories.AsQueryable();

        if (request.IncludeAll)
        {
            // Return every category (all levels) — used by admin management and
            // the storefront mega menu that builds the full parent/child tree.
        }
        else if (request.ParentId is not null)
        {
            query = query.Where(c => c.ParentId == request.ParentId);
        }
        else
        {
            // If no parent specified, return root categories
            query = query.Where(c => c.ParentId == null);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(c => c.IsActive == request.IsActive.Value);
        }

        var categories = await query
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Description,
                c.Slug,
                c.ImageUrl,
                c.ParentId,
                c.DisplayOrder,
                c.IsActive,
                c.Products.Count(p => p.IsActive)
            ))
            .ToListAsync(cancellationToken);

        // ProductCount above only counts products placed directly in a category.
        // Roll subcategory products up so a parent like "Mutfak Sistemleri",
        // whose products all live in subcategories, doesn't show 0.
        var tree = await _context.Categories
            .Select(c => new { c.Id, c.ParentId, Direct = c.Products.Count(p => p.IsActive) })
            .ToListAsync(cancellationToken);
        var childrenOf = tree.Where(c => c.ParentId != null).ToLookup(c => c.ParentId!);
        var directById = tree.ToDictionary(c => c.Id, c => c.Direct);

        int Total(string id, HashSet<string> seen) =>
            !seen.Add(id) ? 0 : directById.GetValueOrDefault(id) + childrenOf[id].Sum(c => Total(c.Id, seen));

        var withTotals = categories
            .Select(c => c with { ProductCount = Total(c.Id, new HashSet<string>()) })
            .ToList();

        return Result<IReadOnlyList<CategoryDto>>.Success(withTotals);
    }
}

