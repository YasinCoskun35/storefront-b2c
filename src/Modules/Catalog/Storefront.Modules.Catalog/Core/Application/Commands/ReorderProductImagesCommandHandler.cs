using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Catalog.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed class ReorderProductImagesCommandHandler : IRequestHandler<ReorderProductImagesCommand, Result<bool>>
{
    private readonly CatalogDbContext _context;

    public ReorderProductImagesCommandHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(ReorderProductImagesCommand request, CancellationToken cancellationToken)
    {
        var images = await _context.ProductImages
            .Where(i => i.ProductId == request.ProductId)
            .ToListAsync(cancellationToken);

        var imagesById = images.ToDictionary(i => i.Id);

        for (var position = 0; position < request.ImageIds.Count; position++)
        {
            if (!imagesById.TryGetValue(request.ImageIds[position], out var image))
            {
                return Result<bool>.Failure(Error.NotFound("ProductImage.NotFound", $"Image with ID '{request.ImageIds[position]}' not found."));
            }

            // Move every variant (Original/Medium/Large/Thumbnail) of this photo together.
            var groupMembers = image.GroupId is not null
                ? images.Where(i => i.GroupId == image.GroupId)
                : new[] { image };

            foreach (var member in groupMembers)
            {
                member.DisplayOrder = position;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
