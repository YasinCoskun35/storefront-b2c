using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Content.Core.Application.DTOs;
using Storefront.Modules.Content.Core.Domain.Entities;
using Storefront.Modules.Content.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Content.Core.Application.Queries;

public sealed class GetStoreSettingsQueryHandler : IRequestHandler<GetStoreSettingsQuery, Result<StoreSettingsDto>>
{
    private readonly ContentDbContext _context;

    public GetStoreSettingsQueryHandler(ContentDbContext context)
    {
        _context = context;
    }

    public async Task<Result<StoreSettingsDto>> Handle(GetStoreSettingsQuery request, CancellationToken cancellationToken)
    {
        var settings = await _context.StoreSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == StoreSettings.DefaultId, cancellationToken);

        // Fall back to sensible defaults if the row hasn't been created yet.
        settings ??= new StoreSettings();

        return Result<StoreSettingsDto>.Success(StoreSettingsMapper.ToDto(settings));
    }
}
