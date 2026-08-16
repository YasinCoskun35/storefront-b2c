using MediatR;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed record UpdateCategoryCommand(
    string Id,
    string Name,
    string? Description,
    string? Slug,
    string? ParentId,
    int DisplayOrder = 0,
    bool IsActive = true
) : IRequest<Result<string>>;
