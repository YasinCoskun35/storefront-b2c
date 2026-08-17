using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Storefront.Modules.Catalog.Core.Domain.Entities;
using Storefront.Modules.Catalog.Core.Domain.Enums;
using Storefront.Modules.Catalog.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed class DeleteProductImageCommandHandler : IRequestHandler<DeleteProductImageCommand, Result<bool>>
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<DeleteProductImageCommandHandler> _logger;

    public DeleteProductImageCommandHandler(CatalogDbContext context, ILogger<DeleteProductImageCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(DeleteProductImageCommand request, CancellationToken cancellationToken)
    {
        var image = await _context.ProductImages
            .FirstOrDefaultAsync(i => i.Id == request.ImageId && i.ProductId == request.ProductId, cancellationToken);

        if (image is null)
        {
            return Result<bool>.Failure(Error.NotFound("ProductImage.NotFound", $"Image with ID '{request.ImageId}' not found."));
        }

        // One uploaded photo produces multiple variant rows (Original/Medium/Large/
        // Thumbnail) sharing a GroupId; remove them together so no orphan variants remain.
        var imagesToRemove = image.GroupId is not null
            ? await _context.ProductImages
                .Where(i => i.ProductId == request.ProductId && i.GroupId == image.GroupId)
                .ToListAsync(cancellationToken)
            : new List<ProductImage> { image };

        var wasPrimary = imagesToRemove.Any(i => i.IsPrimary);

        _context.ProductImages.RemoveRange(imagesToRemove);
        await _context.SaveChangesAsync(cancellationToken);

        if (wasPrimary)
        {
            var replacement = await _context.ProductImages
                .Where(i => i.ProductId == request.ProductId)
                .OrderBy(i => i.Type == ImageType.Original ? 0 : 1)
                .ThenBy(i => i.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (replacement is not null)
            {
                replacement.IsPrimary = true;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        foreach (var removed in imagesToRemove)
        {
            TryDeleteFile(removed.Url);
        }

        return Result<bool>.Success(true);
    }

    private void TryDeleteFile(string url)
    {
        try
        {
            var relativePath = url.TrimStart('/');
            if (File.Exists(relativePath))
            {
                File.Delete(relativePath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete image file: {Url}", url);
        }
    }
}
