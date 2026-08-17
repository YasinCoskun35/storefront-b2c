using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Catalog.Core.Domain.Enums;
using Storefront.Modules.Catalog.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed class SetPrimaryProductImageCommandHandler : IRequestHandler<SetPrimaryProductImageCommand, Result<bool>>
{
    private readonly CatalogDbContext _context;

    public SetPrimaryProductImageCommandHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(SetPrimaryProductImageCommand request, CancellationToken cancellationToken)
    {
        var target = await _context.ProductImages
            .FirstOrDefaultAsync(i => i.Id == request.ImageId && i.ProductId == request.ProductId, cancellationToken);

        if (target is null)
        {
            return Result<bool>.Failure(Error.NotFound("ProductImage.NotFound", $"Image with ID '{request.ImageId}' not found."));
        }

        var productImages = await _context.ProductImages
            .Where(i => i.ProductId == request.ProductId)
            .ToListAsync(cancellationToken);

        foreach (var image in productImages)
        {
            image.IsPrimary = false;
        }

        // Prefer flagging the full-size Original variant of the chosen photo as
        // primary, matching how newly-uploaded photos are marked.
        var newPrimary = target.GroupId is not null
            ? productImages.FirstOrDefault(i => i.GroupId == target.GroupId && i.Type == ImageType.Original)
                ?? target
            : target;

        newPrimary.IsPrimary = true;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
